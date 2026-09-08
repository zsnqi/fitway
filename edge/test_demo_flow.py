import random
import unittest
from datetime import datetime, timedelta, timezone

import simulator


class DemoFlowTests(unittest.TestCase):
    def test_week_long_presentation_has_no_unbounded_count_drift(self):
        rng = random.Random(42)
        count = 34
        start = datetime(2026, 9, 6, 1, tzinfo=timezone.utc)
        counts = []
        for sample in range(7 * 24 * 180):
            entries, exits = simulator.demo_flow(rng, count, start + timedelta(seconds=sample * 20))
            self.assertGreaterEqual(entries, 0)
            self.assertGreaterEqual(exits, 0)
            self.assertLessEqual(exits, count)
            count += entries - exits
            self.assertLessEqual(count, 120)
            self.assertGreaterEqual(count, 0)
            counts.append(count)
        self.assertGreater(max(counts), 65)
        self.assertLess(min(counts), 10)

    def test_runaway_saved_count_converges_via_crossings_without_reset(self):
        rng = random.Random(42)
        count = 417
        initial = count
        entered = exited = 0
        now = datetime(2026, 9, 6, 19, tzinfo=timezone.utc)
        for sample in range(60):
            entries, exits = simulator.demo_flow(rng, count, now + timedelta(seconds=sample * 20))
            entered += entries
            exited += exits
            count += entries - exits
            self.assertGreaterEqual(count, 0)
        self.assertLess(count, 90)
        self.assertEqual(count, initial + entered - exited)

    def test_demo_is_opt_in_and_normal_flow_is_unchanged(self):
        self.assertEqual(simulator.parser().parse_args(['--base-url', 'http://127.0.0.1:1']).mode, 'normal')
        state = {'count': 10, 'minute': '', 'entries': 0, 'exits': 0}
        expected = simulator.next_flow(random.Random(91), 'normal', 10)
        simulator.record_sample(state, random.Random(91), 'normal', datetime(2026, 9, 6, tzinfo=timezone.utc))
        self.assertEqual((state['entries'], state['exits']), expected)
