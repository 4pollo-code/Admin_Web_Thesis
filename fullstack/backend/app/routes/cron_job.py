from flask import Blueprint, jsonify
import datetime

cron_bp = Blueprint("cron", __name__)

@cron_bp.route("/cron", methods=["GET"])
def run_cron_task():
    # Replace with your real task
    print("Cron task executed at", datetime.datetime.now())
    return jsonify({"message": "Cron task executed"}), 200