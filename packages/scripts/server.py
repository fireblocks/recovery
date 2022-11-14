#!/usr/bin/env python

from functools import wraps
from flask import Flask, request, current_app
from flask_restful import Resource, Api
import argparse
import jwt

JWT_ALGORITHM = "HS256"

app = Flask(__name__)
api = Api(app)


unauthorized_error = {"error": "Unauthorized", "data": None}, 401


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if current_app.config["SECRET_KEY"]:
            token = None
            if "Authorization" in request.headers:
                token = request.headers["Authorization"].split(" ")[1]
            if not token:
                return unauthorized_error
            try:
                jwt.decode(
                    token, current_app.config["SECRET_KEY"], algorithms=[
                        JWT_ALGORITHM]
                )
            except Exception:
                return unauthorized_error

        return f(*args, **kwargs)

    return decorated


class Heartbeat(Resource):
    @jwt_required
    def get(self):
        return {"data": "OK"}, 200


api.add_resource(Heartbeat, "/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Recovery Utility", description="Fireblocks workspace recovery utility"
    )
    parser.add_argument(
        "-p", "--port", help="HTTP server port", type=int, default=5000)
    parser.add_argument("-s", "--secret", type=str, help="JWT secret")
    parser.add_argument("-d", "--debug", help="debug mode",
                        action="store_true")
    args = parser.parse_args()

    if args.secret:
        app.config["SECRET_KEY"] = args.secret

    app.run(debug=args.debug, port=args.port)
