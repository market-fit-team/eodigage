from __future__ import annotations

import unittest

from app.two_tower.codecs import decode_profile_code, encode_profile_code


class ProfileCodeTestCase(unittest.TestCase):
    def test_profile_code_roundtrip_preserves_category_and_scores(self) -> None:
        """공유 코드는 업종과 9개 점수를 손실 없이 왕복 복원해야 한다."""

        payload = {
            "user_id": "roundtrip-user",
            "profile_name": "라운드트립",
            "preferred_category_code": "CS100005",
            "budget_level": 2,
            "stability_level": 5,
            "subway_dependency_level": 1,
            "weekend_preference_level": 3,
            "evening_preference_level": 2,
            "resident_focus_level": 5,
            "worker_focus_level": 1,
            "rent_sensitivity_level": 5,
            "competition_tolerance_level": 1,
        }

        profile_code = encode_profile_code(payload)
        decoded = decode_profile_code(profile_code)

        self.assertEqual(len(profile_code), 9)
        self.assertEqual(decoded["preferred_category_code"], payload["preferred_category_code"])
        self.assertEqual(decoded["budget_level"], payload["budget_level"])
        self.assertEqual(decoded["competition_tolerance_level"], payload["competition_tolerance_level"])

    def test_invalid_profile_code_raises_error(self) -> None:
        """잘못된 공유 코드는 예외로 거절해야 한다."""

        with self.assertRaises(ValueError):
            decode_profile_code("invalid")


if __name__ == "__main__":
    unittest.main()
