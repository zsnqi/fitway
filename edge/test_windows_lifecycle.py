"""Windows lifecycle contract for the FITWAY edge client.

These tests never register, modify, or remove a real Scheduled Task. The installer is exercised
only through its non-mutating `-PlanOnly` seam, and the watchdog is exercised only against
disposable child process trees inside a per-test temporary directory.

Nothing here proves a site acceptance. Task permissions on the real edge PC, physical reboot,
and power-cut recovery remain external gates.
"""

import json
import os
import subprocess
import sqlite3
import sys
import tempfile
import textwrap
import time
import unittest
from pathlib import Path

WINDOWS_DIRECTORY = Path(__file__).parent / "windows"
INSTALL = WINDOWS_DIRECTORY / "install.ps1"
RUN = WINDOWS_DIRECTORY / "run.ps1"
UNINSTALL = WINDOWS_DIRECTORY / "uninstall.ps1"

TOKEN = "synthetic-edge-token-for-tests-0123456789abcdef"
PRINCIPAL = "FITWAY-EDGE\\edge-runtime"
TASK_NAME = "FITWAY Edge Counter Test Plan"

EXIT_OK = 0
EXIT_INVALID_ARGUMENT = 10
EXIT_MODE_REQUIRED = 11
EXIT_MANIFEST_INVALID = 11
EXIT_ALREADY_RUNNING = 12
EXIT_HOT_RESTART_LOOP = 13
EXIT_DATA_REMOVAL_UNCONFIRMED = 14


def powershell(script, *arguments, timeout=180, cwd=None):
    command = [
        "powershell",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script),
    ]
    command.extend(str(value) for value in arguments)
    return subprocess.run(command, capture_output=True, text=True, timeout=timeout, cwd=cwd)


def process_alive(process_id):
    result = subprocess.run(
        ["tasklist", "/FI", f"PID eq {int(process_id)}", "/NH"],
        capture_output=True,
        text=True,
    )
    return str(int(process_id)) in result.stdout


def wait_for(predicate, timeout=30.0, interval=0.2):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(interval)
    return predicate()


@unittest.skipUnless(sys.platform == "win32", "The Windows lifecycle scripts require Windows")
class LifecycleTestCase(unittest.TestCase):
    def setUp(self):
        self._folder = tempfile.TemporaryDirectory()
        self.addCleanup(self._folder.cleanup)
        self.root = Path(self._folder.name)
        self.data_root = self.root / "data"
        (self.data_root / "state").mkdir(parents=True)
        (self.data_root / "config").mkdir(parents=True)
        self.config_path = self.data_root / "config" / "client.json"
        self.config_path.write_text(json.dumps({"schemaVersion": 1}), encoding="utf-8")
        self.token_path = self.data_root / "config" / "device.token"
        self.token_path.write_text(TOKEN, encoding="utf-8")
        self.version_root = self.root / "versions" / "1.0.0"
        (self.version_root / "edge").mkdir(parents=True)
        self.manifest = self.root / "current.json"
        self.manifest.write_text(
            json.dumps({"version": "1.0.0", "versionPath": str(self.version_root)}),
            encoding="utf-8",
        )
        self.sqlite_path = self.data_root / "state" / "edge-state.sqlite3"

    def write_client(self, body):
        target = self.version_root / "edge" / "client.py"
        target.write_text(textwrap.dedent(body), encoding="utf-8")
        return target


class InstallPlanTests(LifecycleTestCase):
    def plan(self, *extra, cwd=None):
        result = powershell(
            INSTALL,
            "-PythonExe", sys.executable,
            "-WatchdogScript", RUN.resolve(),
            "-CurrentManifest", self.manifest,
            "-ConfigPath", self.config_path,
            "-TokenPath", self.token_path,
            "-DataRoot", self.data_root,
            "-Principal", PRINCIPAL,
            "-TaskName", TASK_NAME,
            "-PlanOnly",
            *extra,
            cwd=cwd,
        )
        self.assertEqual(result.returncode, EXIT_OK, result.stderr)
        return result.stdout

    def test_the_plan_describes_the_exact_boot_task(self):
        plan = json.loads(self.plan())
        self.assertEqual(plan["taskName"], TASK_NAME)
        self.assertEqual(plan["principal"]["userId"], PRINCIPAL)
        self.assertEqual(plan["principal"]["logonType"], "S4U")
        self.assertEqual(plan["principal"]["runLevel"], "Limited")
        self.assertEqual(plan["trigger"]["type"], "AtStartup")
        self.assertEqual(plan["settings"]["multipleInstances"], "IgnoreNew")
        self.assertEqual(plan["settings"]["restartCount"], 3)
        self.assertEqual(plan["settings"]["restartIntervalMinutes"], 1)
        self.assertEqual(plan["settings"]["executionTimeLimit"], "PT0S")

    def test_every_action_path_is_absolute_and_independent_of_the_environment(self):
        plan = json.loads(self.plan())
        execute = plan["action"]["execute"]
        self.assertTrue(os.path.isabs(execute))
        self.assertTrue(execute.lower().endswith("powershell.exe"))
        arguments = plan["action"]["arguments"]
        for required in (str(RUN.resolve()), sys.executable, str(self.manifest), str(self.config_path), str(self.data_root)):
            self.assertIn(required, arguments)
        self.assertIn("-NoProfile", arguments)
        self.assertIn("-ExecutionPolicy Bypass", arguments)
        self.assertEqual(plan["action"]["workingDirectory"], str(self.data_root))
        self.assertTrue(plan["cwdIndependent"])
        self.assertFalse(plan["usesPathLookup"])
        for value in plan["paths"].values():
            self.assertTrue(os.path.isabs(value), value)

    def test_the_plan_is_identical_from_any_working_directory(self):
        first = json.loads(self.plan(cwd=str(self.root)))
        second = json.loads(self.plan(cwd=str(Path(sys.executable).parent)))
        self.assertEqual(first, second)

    def test_the_plan_provisions_least_privilege_acls(self):
        plan = json.loads(self.plan())
        by_path = {entry["path"]: entry for entry in plan["acl"]}
        self.assertIn(str(self.token_path), by_path)
        self.assertIn(str(self.config_path), by_path)
        secret_entry = by_path[str(self.token_path)]
        self.assertEqual(secret_entry["operation"], "reset_inheritance_and_restrict_read")
        self.assertIn("/inheritance:r", secret_entry["command"])
        self.assertEqual(
            secret_entry["identities"],
            ["BUILTIN\\Administrators:(R)", "NT AUTHORITY\\SYSTEM:(R)", PRINCIPAL + ":(R)"],
        )
        data_entry = by_path[str(self.data_root)]
        self.assertIn(PRINCIPAL + ":(OI)(CI)(M)", data_entry["identities"])
        for entry in plan["acl"]:
            self.assertNotIn("Everyone", entry["command"])
            self.assertNotIn("Users:(F)", entry["command"])

    def test_the_plan_carries_no_secret_of_any_kind(self):
        plan_text = self.plan()
        self.assertNotIn(TOKEN, plan_text)
        lowered = plan_text.lower()
        for forbidden in ("password", "rtsp", "://", "bearer", "currentcount"):
            self.assertNotIn(forbidden, lowered, forbidden)
        self.assertFalse(json.loads(plan_text)["carriesSecret"])

    def test_a_relative_path_is_refused(self):
        result = powershell(
            INSTALL,
            "-PythonExe", "python.exe",
            "-WatchdogScript", RUN.resolve(),
            "-CurrentManifest", self.manifest,
            "-ConfigPath", self.config_path,
            "-TokenPath", self.token_path,
            "-DataRoot", self.data_root,
            "-Principal", PRINCIPAL,
            "-PlanOnly",
        )
        self.assertEqual(result.returncode, EXIT_INVALID_ARGUMENT)
        self.assertIn("relative_path:PythonExe", result.stdout)

    def test_neither_plan_only_nor_install_registers_nothing(self):
        result = powershell(
            INSTALL,
            "-PythonExe", sys.executable,
            "-WatchdogScript", RUN.resolve(),
            "-CurrentManifest", self.manifest,
            "-ConfigPath", self.config_path,
            "-TokenPath", self.token_path,
            "-DataRoot", self.data_root,
            "-Principal", PRINCIPAL,
        )
        self.assertEqual(result.returncode, EXIT_MODE_REQUIRED)
        self.assertIn("specify_plan_only_or_install", result.stdout)


class WatchdogTests(LifecycleTestCase):
    def watchdog_arguments(self, **overrides):
        arguments = {
            "-PythonExe": sys.executable,
            "-CurrentManifest": self.manifest,
            "-ConfigPath": self.config_path,
            "-DataRoot": self.data_root,
            "-RestartDelaySeconds": 0,
        }
        arguments.update(overrides)
        flat = []
        for name, value in arguments.items():
            flat.extend([name, str(value)])
        return flat

    def start_watchdog(self, **overrides):
        command = [
            "powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
            "-File", str(RUN),
        ] + self.watchdog_arguments(**overrides)
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.addCleanup(self._terminate, process)
        return process

    def _terminate(self, process):
        if process.poll() is None:
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True
            )
            process.wait(timeout=30)
        for stream in (process.stdout, process.stderr):
            if stream is not None and not stream.closed:
                stream.close()

    def test_an_unexpected_exit_restarts_within_the_budget_and_keeps_one_state_file(self):
        self.write_client(f"""
            import sqlite3, sys
            connection = sqlite3.connect(r"{self.sqlite_path}")
            connection.execute("CREATE TABLE IF NOT EXISTS starts (id INTEGER PRIMARY KEY)")
            connection.execute("INSERT INTO starts DEFAULT VALUES")
            connection.commit()
            connection.close()
            sys.exit(1)
            """)
        result = powershell(RUN, *self.watchdog_arguments(**{"-MaxRestarts": 2}), timeout=180)
        self.assertEqual(result.returncode, EXIT_OK, result.stdout + result.stderr)
        self.assertIn("restart_budget_reached", result.stdout)
        connection = sqlite3.connect(str(self.sqlite_path))
        self.addCleanup(connection.close)
        self.assertEqual(connection.execute("SELECT COUNT(*) FROM starts").fetchone()[0], 3)
        self.assertEqual(
            [item.name for item in (self.data_root / "state").iterdir()],
            ["edge-state.sqlite3"],
        )

    def test_a_hot_restart_loop_is_refused(self):
        self.write_client("""
            import sys
            sys.exit(1)
            """)
        result = powershell(
            RUN,
            *self.watchdog_arguments(**{"-MaxRestartsInWindow": 2, "-RestartWindowSeconds": 60}),
            timeout=180,
        )
        self.assertEqual(result.returncode, EXIT_HOT_RESTART_LOOP, result.stdout)
        self.assertIn("hot_restart_loop", result.stdout)

    def test_a_stop_request_terminates_the_whole_process_tree(self):
        pids_path = self.root / "pids.txt"
        self.write_client(f"""
            import os, subprocess, sys, time
            grandchild = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(300)"])
            with open(r"{pids_path}", "w", encoding="utf-8") as stream:
                stream.write("{{0}}\\n{{1}}\\n".format(os.getpid(), grandchild.pid))
            time.sleep(300)
            """)
        stop_file = self.root / "stop.flag"
        process = self.start_watchdog(**{"-StopFile": stop_file})
        self.assertTrue(wait_for(pids_path.exists), "the disposable client never started")
        recorded = [int(value) for value in pids_path.read_text(encoding="utf-8").split()]
        self.assertTrue(wait_for(lambda: all(process_alive(value) for value in recorded)))
        stop_file.write_text("stop", encoding="utf-8")
        process.wait(timeout=60)
        self.assertEqual(process.returncode, EXIT_OK)
        for recorded_pid in recorded:
            self.assertTrue(
                wait_for(lambda value=recorded_pid: not process_alive(value), timeout=30),
                f"process {recorded_pid} was orphaned",
            )
        self.assertFalse((self.data_root / "client.pid").exists())
        self.assertFalse((self.data_root / "watchdog.pid").exists())

    def test_a_second_watchdog_is_refused_by_the_singleton_lock(self):
        self.write_client("""
            import time
            time.sleep(300)
            """)
        stop_file = self.root / "stop.flag"
        first = self.start_watchdog(**{"-StopFile": stop_file})
        self.assertTrue(wait_for((self.data_root / "client.pid").exists))
        second = powershell(RUN, *self.watchdog_arguments(**{"-MaxRuntimeSeconds": 5}), timeout=120)
        self.assertEqual(second.returncode, EXIT_ALREADY_RUNNING, second.stdout)
        self.assertIn("singleton_held", second.stdout)
        stop_file.write_text("stop", encoding="utf-8")
        first.wait(timeout=60)

    def test_an_invalid_manifest_fails_closed(self):
        self.write_client("import sys\nsys.exit(0)\n")
        self.manifest.write_text(json.dumps({"version": "1.0.0", "versionPath": "relative"}), encoding="utf-8")
        result = powershell(RUN, *self.watchdog_arguments(), timeout=120)
        self.assertEqual(result.returncode, EXIT_MANIFEST_INVALID)
        self.assertIn("version_path_not_absolute", result.stdout)

    def test_a_manifest_without_the_client_in_its_version_fails_closed(self):
        result = powershell(RUN, *self.watchdog_arguments(), timeout=120)
        self.assertEqual(result.returncode, EXIT_MANIFEST_INVALID)
        self.assertIn("client_missing_in_version", result.stdout)

    def test_the_watchdog_never_logs_the_token(self):
        self.write_client("import sys\nsys.exit(0)\n")
        result = powershell(RUN, *self.watchdog_arguments(**{"-MaxRestarts": 0}), timeout=120)
        self.assertEqual(result.returncode, EXIT_OK)
        log = (self.data_root / "logs" / "watchdog.log").read_text(encoding="utf-8")
        for text in (result.stdout, log):
            self.assertNotIn(TOKEN, text)
            self.assertNotIn("://", text)


class UninstallTests(WatchdogTests):
    def test_the_plan_removes_only_the_named_task_and_preserves_data(self):
        result = powershell(
            UNINSTALL, "-DataRoot", self.data_root, "-TaskName", TASK_NAME, "-PlanOnly"
        )
        self.assertEqual(result.returncode, EXIT_OK, result.stderr)
        plan = json.loads(result.stdout)
        self.assertEqual(plan["taskName"], TASK_NAME)
        self.assertFalse(plan["removesTask"])
        self.assertFalse(plan["removesData"])
        self.assertIn(str(self.data_root / "state"), plan["preservedPaths"])
        self.assertIn(str(self.data_root / "config"), plan["preservedPaths"])
        self.assertTrue(self.token_path.exists())

    def test_data_removal_requires_a_separate_confirmation(self):
        result = powershell(
            UNINSTALL, "-DataRoot", self.data_root, "-Remove", "-RemoveData"
        )
        self.assertEqual(result.returncode, EXIT_DATA_REMOVAL_UNCONFIRMED)
        self.assertIn("confirmation_required", result.stdout)
        self.assertTrue(self.token_path.exists())
        self.assertTrue(self.config_path.exists())

    def test_a_mode_is_required_before_anything_is_stopped(self):
        result = powershell(UNINSTALL, "-DataRoot", self.data_root)
        self.assertEqual(result.returncode, EXIT_MODE_REQUIRED)
        self.assertIn("specify_plan_only_stop_only_or_remove", result.stdout)

    def test_stop_only_stops_the_running_watchdog_and_preserves_state(self):
        self.write_client(f"""
            import sqlite3, time
            connection = sqlite3.connect(r"{self.sqlite_path}")
            connection.execute("CREATE TABLE IF NOT EXISTS starts (id INTEGER PRIMARY KEY)")
            connection.execute("INSERT INTO starts DEFAULT VALUES")
            connection.commit()
            connection.close()
            time.sleep(300)
            """)
        stop_file = self.root / "stop.flag"
        watchdog = self.start_watchdog(**{"-StopFile": stop_file})
        self.assertTrue(wait_for((self.data_root / "client.pid").exists))
        result = powershell(
            UNINSTALL,
            "-DataRoot", self.data_root,
            "-StopFile", stop_file,
            "-StopOnly",
            timeout=120,
        )
        self.assertEqual(result.returncode, EXIT_OK, result.stdout + result.stderr)
        self.assertIn("data_preserved", result.stdout)
        watchdog.wait(timeout=60)
        self.assertTrue(self.sqlite_path.exists())
        self.assertTrue(self.token_path.exists())
        connection = sqlite3.connect(str(self.sqlite_path))
        self.addCleanup(connection.close)
        self.assertGreaterEqual(connection.execute("SELECT COUNT(*) FROM starts").fetchone()[0], 1)


@unittest.skipUnless(sys.platform == "win32", "The Windows lifecycle scripts require Windows")
class ScriptSyntaxTests(unittest.TestCase):
    def test_every_lifecycle_script_parses(self):
        for script in (INSTALL, RUN, UNINSTALL):
            with self.subTest(script=script.name):
                result = subprocess.run(
                    [
                        "powershell", "-NoProfile", "-NonInteractive", "-Command",
                        f"[void][scriptblock]::Create((Get-Content -Raw '{script}'))",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_no_lifecycle_script_contains_a_literal_secret(self):
        for script in (INSTALL, RUN, UNINSTALL):
            body = script.read_text(encoding="utf-8").lower()
            with self.subTest(script=script.name):
                self.assertNotIn("rtsp", body)
                self.assertNotIn("bearer", body)
                self.assertNotIn("-token ", body)


if __name__ == "__main__":
    unittest.main()
