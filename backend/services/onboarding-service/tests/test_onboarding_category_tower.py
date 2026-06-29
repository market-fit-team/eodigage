from __future__ import annotations

import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

from app.models.onboarding_category_tower.predict import _scale_scores_to_unit_interval
from app.models.onboarding_category_tower import runtime as category_runtime
from app.models.onboarding_category_tower.runtime import predict_payload, train_runtime
from app.models.onboarding_category_tower.train import resolve_data_mode
from app.models.onboarding_category_tower.user_profiles import build_user_prototype


class OnboardingCategoryTowerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        """테스트 시작 전에 경량 학습으로 업종 추천 artifact를 맞춘다."""

        cls.metadata = train_runtime(epochs=2)

    def test_training_metadata_contains_expected_fields(self) -> None:
        """학습 결과 메타데이터는 이후 API 연결에 필요한 핵심 필드를 포함해야 한다."""

        self.assertEqual(self.metadata["model_id"], "onboarding_category_tower")
        self.assertEqual(self.metadata["data_mode"], "sample")
        self.assertEqual(self.metadata["category_count"], 5)
        self.assertGreaterEqual(self.metadata["embedding_dim"], 16)
        self.assertIn("user_numeric_features", self.metadata)
        self.assertIn("item_numeric_features", self.metadata)

    def test_resolve_data_mode_prefers_artifact_metadata(self) -> None:
        """런타임 data mode를 넘기지 않으면 저장된 artifact metadata 값을 우선 사용해야 한다."""

        self.assertEqual(resolve_data_mode(None, {"data_mode": "raw"}), "raw")

    def test_known_sample_profile_returns_target_category_within_top_k(self) -> None:
        """기준 프로토타입으로 예측하면 해당 업종이 상위 추천 안에 포함돼야 한다."""

        payload = predict_payload({"user_id": "category_proto_cs100005"}, top_k=5)
        codes = [row["service_category_code"] for row in payload["recommendations"]]

        self.assertEqual(payload["model_id"], "onboarding_category_tower")
        self.assertEqual(payload["user_profile"]["user_id"], "category_proto_cs100005")
        self.assertIn("CS100005", codes)
        self.assertEqual(len(payload["recommendations"]), 5)

    def test_score_scaling_keeps_values_inside_open_unit_interval(self) -> None:
        """업종 추천 점수는 후보 상대 비교와 무관하게 0과 1 사이에서 유지돼야 한다."""

        raw_scores = np.array([2.0, 1.0, -1.0], dtype=np.float32)

        scaled_scores = _scale_scores_to_unit_interval(raw_scores)

        self.assertGreater(float(scaled_scores[0]), float(scaled_scores[1]))
        self.assertGreater(float(scaled_scores[1]), float(scaled_scores[2]))
        for score in scaled_scores:
            self.assertGreater(float(score), 0.0)
            self.assertLess(float(score), 1.0)

    def test_score_scaling_does_not_depend_on_other_candidates(self) -> None:
        """같은 raw score는 다른 후보가 섞여도 같은 0~1 점수로 매핑돼야 한다."""

        full_scores = _scale_scores_to_unit_interval(np.array([2.0, 1.0, -1.0], dtype=np.float32))
        partial_scores = _scale_scores_to_unit_interval(np.array([2.0, -1.0], dtype=np.float32))

        self.assertAlmostEqual(float(full_scores[0]), float(partial_scores[0]), places=6)
        self.assertAlmostEqual(float(full_scores[2]), float(partial_scores[1]), places=6)

    def test_build_user_prototype_clamps_out_of_range_category_scores(self) -> None:
        """raw 집계값이 0~1 범위를 넘어도 프로토타입 생성은 validation 에러 없이 clamp 해야 한다."""

        category = pd.Series(
            {
                "service_category_code": "CS999999",
                "service_category_name": "테스트 업종",
                "stability_prior_score": 1.2,
                "competition_pressure_score": -0.1,
                "weekend_sales_ratio": 0.7,
                "lunch_sales_ratio": 0.4,
                "evening_sales_ratio": 0.5,
                "late_night_sales_ratio": 0.2,
                "age_10_ratio": 0.1,
                "age_20_ratio": 0.2,
                "age_30_ratio": 0.3,
                "age_40_ratio": 0.2,
                "age_50_plus_ratio": 0.2,
                "female_sales_ratio": 1.1,
                "avg_ticket_score": 0.8,
                "sales_count_score": 0.6,
                "franchise_ratio": 1.1854735221148087,
                "labor_intensity_score": 1.3,
                "space_efficiency_score": -0.2,
            }
        )

        payload = build_user_prototype(category)

        self.assertEqual(payload["franchise_affinity_level"], 1.0)
        self.assertEqual(payload["stability_level"], 1.0)
        self.assertEqual(payload["competition_tolerance_level"], 0.0)
        self.assertEqual(payload["labor_intensity_tolerance"], 1.0)
        self.assertEqual(payload["space_efficiency_preference"], 0.0)

    def test_runtime_prediction_uses_metadata_data_mode(self) -> None:
        """런타임 예측은 현재 로드된 metadata의 data mode를 그대로 predict 계층에 넘겨야 한다."""

        with patch.object(category_runtime, "get_runtime", return_value=(object(), {"data_mode": "raw"})):
            with patch.object(category_runtime, "predict_with_runtime", return_value={"ok": True}) as mock_predict:
                payload = predict_payload({"user_id": "category_user"}, top_k=3)

        self.assertEqual(payload, {"ok": True})
        self.assertEqual(mock_predict.call_args.kwargs["data_mode"], "raw")


if __name__ == "__main__":
    unittest.main()
