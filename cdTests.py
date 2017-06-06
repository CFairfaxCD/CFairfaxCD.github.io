from flask import Flask, flash, redirect, render_template, request, session, url_for
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("home.html")

@app.route('/form-capture')
def formCapture():
    return render_template("form-capture.html")

@app.route('/success')
def success():
    return render_template("success.html")

@app.route('/error')
def error():
    return render_template("error.html")

@app.route('/survey')
def survey():
    return render_template("survey.html")

@app.route('/programatic-capture', methods=["GET", "POST"])
def programaticCapture():
    if request.method == "GET":
        return render_template("programatic-capture.html")
    elif request.method == "POST":
        cdUrl = 'http://analytics.clickdimensions.com/forms/h/aqXLaVKMFu0KHNiDMJHf1u'
        header = {'Referer' : 'http://cnfairfax.pythonanywhere.com'}
        fields = {'firstName' : request.form.get('firstName'), 'lname' : request.form.get('lname'), 'city' : request.form.get('city'), 'Email' : request.form.get('Email')}

        res = requests.post(cdUrl, headers=header, data=fields)

        return res.text