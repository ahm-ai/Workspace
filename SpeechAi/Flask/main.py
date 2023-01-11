from flask import Flask
import whisper

app = Flask(__name__)

model = whisper.load_model("tiny")


@app.route('/')
def home():
    # load audio and pad/trim it to fit 30 seconds
    # audio = whisper.load_audio("output001.mp4")
    # audio = whisper.pad_or_trim(audio)

    result = model.transcribe("output001.mp4")
    print(result["text"])
    return 'Hello, World!'


app.run(debug=True)
