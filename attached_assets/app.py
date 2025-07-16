from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import os

app = Flask(__name__)
CORS(app)

@app.route('/classify', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({'result': 'No image provided'}), 400

    waste_types = ['Plastic', 'Organic', 'Metal', 'Paper', 'E-Waste']
    result = random.choice(waste_types)

    return jsonify({'result': result})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
