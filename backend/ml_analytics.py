import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.ensemble import IsolationForest
from .models import RequestLog, Alert, Setting

# In-memory ML state (persisted per session / retrained on demand)
class MLAnalyticsEngine:
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.last_trained: Optional[str] = None
        self.sample_count: int = 0
        self.anomaly_count: int = 0
        self.contamination: float = 0.05
        self.feature_names: List[str] = [
            "total_requests",
            "failed_request_ratio",
            "server_error_ratio",
            "unique_endpoints_count",
            "avg_latency_ms",
            "post_put_ratio"
        ]
        self.evaluation_metrics: Optional[Dict[str, Any]] = None
        self.is_trained: bool = False

    def extract_ip_features(self, db: Session) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
        """
        Extracts aggregate behavioral features per client IP from request logs.
        """
        logs = db.query(RequestLog).all()
        if not logs:
            return None, "No request logs found in database. Send traffic to extract behavioral features."

        data = []
        for l in logs:
            data.append({
                "client_ip": l.client_ip,
                "endpoint": l.endpoint,
                "method": l.method,
                "status_code": l.status_code,
                "duration_ms": l.duration_ms,
                "timestamp": l.timestamp
            })

        df = pd.DataFrame(data)
        if df.empty:
            return None, "Request log dataset is empty."

        # Group by client_ip
        grouped = df.groupby("client_ip")
        rows = []
        for ip, group in grouped:
            total_reqs = len(group)
            failed_reqs = len(group[group["status_code"] >= 400])
            server_errors = len(group[group["status_code"] >= 500])
            unique_endpoints = group["endpoint"].nunique()
            avg_duration = float(group["duration_ms"].mean())
            post_put_reqs = len(group[group["method"].isin(["POST", "PUT", "DELETE", "PATCH"])])

            rows.append({
                "client_ip": ip,
                "total_requests": float(total_reqs),
                "failed_request_ratio": float(failed_reqs / total_reqs if total_reqs > 0 else 0.0),
                "server_error_ratio": float(server_errors / total_reqs if total_reqs > 0 else 0.0),
                "unique_endpoints_count": float(unique_endpoints),
                "avg_latency_ms": float(avg_duration),
                "post_put_ratio": float(post_put_reqs / total_reqs if total_reqs > 0 else 0.0)
            })

        feature_df = pd.DataFrame(rows)
        return feature_df, None

    def train_and_evaluate(self, db: Session, contamination: float = 0.05) -> Dict[str, Any]:
        """
        Trains Isolation Forest if there is sufficient data (>= 6 IP behavioral samples).
        Calculates honest baseline metrics (anomaly ratio, score distributions).
        """
        feature_df, err = self.extract_ip_features(db)
        if err or feature_df is None:
            self.is_trained = False
            return {
                "success": False,
                "message": err or "Failed to extract features."
            }

        num_samples = len(feature_df)
        if num_samples < 5:
            self.is_trained = False
            return {
                "success": False,
                "message": (
                    f"Insufficient distinct client IP samples ({num_samples} available). "
                    "At least 5 distinct client IP behavior profiles are required for unsupervised Isolation Forest training."
                )
            }

        self.contamination = contamination
        X = feature_df[self.feature_names].values

        # Initialize IsolationForest
        # Unsupervised anomaly detection: anomaly score is continuous; prediction is -1 for anomaly, 1 for inlier
        model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )
        model.fit(X)

        # Predictions on current training dataset
        preds = model.predict(X)  # -1 is anomaly, 1 is normal
        scores = model.decision_function(X) # lower score means more abnormal

        anomalies_detected = int(np.sum(preds == -1))

        self.model = model
        self.is_trained = True
        self.last_trained = datetime.now(timezone.utc).isoformat()
        self.sample_count = num_samples
        self.anomaly_count = anomalies_detected

        # Honest unsupervised metrics:
        # Note: In unsupervised anomaly detection without ground truth labels,
        # standard supervised metrics (accuracy/recall) are not applicable unless labeled benchmarks are available.
        # We report genuine distribution metrics: mean anomaly score, outlier percentage, and score spread.
        self.evaluation_metrics = {
            "model_type": "Isolation Forest (Unsupervised)",
            "n_estimators": 100,
            "configured_contamination": self.contamination,
            "total_behavior_samples": num_samples,
            "detected_outliers_count": anomalies_detected,
            "outlier_percentage": round((anomalies_detected / num_samples) * 100, 2),
            "mean_decision_score": round(float(np.mean(scores)), 4),
            "min_decision_score": round(float(np.min(scores)), 4),
            "max_decision_score": round(float(np.max(scores)), 4),
            "evaluation_note": "Evaluated on distinct client behavioral clusters using unsupervised decision scoring. Scores below 0 represent outlier behavioral patterns."
        }

        return {
            "success": True,
            "message": f"Isolation Forest successfully trained on {num_samples} client IP behavioral profiles.",
            "metrics": self.evaluation_metrics
        }

    def score_all_ips(self, db: Session) -> List[Dict[str, Any]]:
        """
        Evaluates all current IPs using the trained model or returns empty list if not trained.
        """
        if not self.is_trained or self.model is None:
            return []

        feature_df, err = self.extract_ip_features(db)
        if feature_df is None or feature_df.empty:
            return []

        X = feature_df[self.feature_names].values
        preds = self.model.predict(X)
        scores = self.model.decision_function(X)

        results = []
        for idx, row in feature_df.iterrows():
            is_anomaly = bool(preds[idx] == -1)
            raw_score = float(scores[idx])
            # Normalized anomaly index (0 = normal, 1 = extreme outlier)
            anomaly_index = round(float(max(0.0, -raw_score * 2.5)), 3)

            # Build human-readable behavioral explanation
            reasons = []
            if row["failed_request_ratio"] > 0.4:
                reasons.append(f"High failure ratio ({row['failed_request_ratio']*100:.1f}%)")
            if row["total_requests"] > 30:
                reasons.append(f"Heavy traffic volume ({int(row['total_requests'])} requests)")
            if row["unique_endpoints_count"] > 5:
                reasons.append(f"Wide endpoint breadth ({int(row['unique_endpoints_count'])} distinct routes)")
            if row["avg_latency_ms"] > 300:
                reasons.append(f"Elevated response latency ({row['avg_latency_ms']:.1f}ms)")

            explanation = (
                f"Isolation Forest flagged behavioral anomaly (score {raw_score:.3f}). "
                + ("; ".join(reasons) if reasons else "Unusual multivariate pattern across request features.")
                if is_anomaly else "Behavior profile aligns with standard baseline traffic."
            )

            results.append({
                "source_ip": row["client_ip"],
                "raw_decision_score": round(raw_score, 4),
                "anomaly_index": anomaly_index,
                "is_anomaly": is_anomaly,
                "features": {
                    "total_requests": row["total_requests"],
                    "failed_request_ratio": round(row["failed_request_ratio"], 3),
                    "server_error_ratio": round(row["server_error_ratio"], 3),
                    "unique_endpoints_count": row["unique_endpoints_count"],
                    "avg_latency_ms": round(row["avg_latency_ms"], 2),
                    "post_put_ratio": round(row["post_put_ratio"], 3)
                },
                "explanation": explanation
            })

        # Sort with highest anomalies first
        results.sort(key=lambda x: (not x["is_anomaly"], x["raw_decision_score"]))
        return results

# Global singleton
ml_engine = MLAnalyticsEngine()
