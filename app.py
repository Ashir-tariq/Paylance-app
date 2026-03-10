from flask import Flask, request, jsonify, render_template
import random
import smtplib

app = Flask(__name__)

otp_storage = {}

sender_email = "a3009419@gmail.com"
app_password = "uzbf aluj nemx onbb"

@app.route("/")
def home():
    return render_template("index.html")

def send_otp(email, otp):
    message = f"""Subject: Paylance OTP Verification

Your OTP code is: {otp}

This OTP is valid for 5 minutes. Do not share it with anyone.
"""
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, email, message)
        server.quit()
        print("OTP sent successfully")
    except Exception as e:
        print("Error sending OTP:", e)

@app.route("/send-otp", methods=["POST"])
def sendotp():
    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"message": "Email required"}), 400
    otp = random.randint(100000, 999999)
    otp_storage[email] = otp
    send_otp(email, otp)
    return jsonify({"message": "OTP sent to your email"})

@app.route("/verify-otp", methods=["POST"])
def verify():
    data = request.get_json()
    email = data.get("email")
    user_otp = data.get("otp")
    saved_otp = otp_storage.get(email)
    if saved_otp and str(saved_otp) == str(user_otp):
        otp_storage.pop(email)
        return jsonify({"message": "OTP Verified", "status": "success"})
    else:
        return jsonify({"message": "Invalid OTP", "status": "fail"})

if __name__ == "__main__":
   app.run(host="0.0.0.0", port=5000)