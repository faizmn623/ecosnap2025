import os
import base64
import logging
import json
from openai import OpenAI

# The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
MODEL = "gpt-4o"

# Initialize the OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

WASTE_INFO = {  # Define this dictionary with valid waste types
    "Plastic": {},
    "Organic": {},
    "Metal": {},
    "Paper": {},
    "E-Waste": {}
}

def analyze_waste_image(image_data):
    """
    Analyze an image to classify waste using OpenAI's vision capabilities

    Args:
        image_data: Binary image data

    Returns:
        dict: Classification result with waste type and confidence, or uncertainty message
    """
    try:
        # Encode the image as base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        # Define the system prompt for waste classification
        system_prompt = """
        You are a waste classification expert. Analyze the image and identify what type of waste is shown.
        Classify it into one of these categories only: Plastic, Organic, Metal, Paper, E-Waste.

        If you cannot determine the waste type with confidence, choose the most likely category.
        Provide your classification along with a brief explanation of why you classified it this way.

        Format your response as:
        {
          "waste_type": "Category name",
          "explanation": "Brief explanation of your classification",
          "confidence": "high/medium/low"
        }
        """

        # Call the OpenAI API
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What type of waste is this?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=500
        )

        # Extract and return the result
        result = response.choices[0].message.content
        logger.info(f"OpenAI waste classification result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error analyzing waste image: {str(e)}")
        raise Exception(f"Failed to analyze image: {str(e)}")


def classify_waste(image_data):
    """
    Classifies waste from image data. Includes improved error handling.

    Args:
        image_data: Binary image data

    Returns:
        dict: A dictionary containing the classification result, or an error message.
    """
    try:
        # Try to get the classification result from OpenAI
        classification_result = analyze_waste_image(image_data)
        classification_json = json.loads(classification_result)

        # Basic validation of response
        if not classification_json or 'waste_type' not in classification_json:
            logger.error("Invalid response format from OpenAI")
            result = "Uncertain"
            explanation = "Unable to analyze image properly. Please try with a clearer image."
            confidence = "low"
        else:
            result = classification_json.get('waste_type')
            explanation = classification_json.get('explanation', '')
            confidence = classification_json.get('confidence', 'medium')

            # Additional validation
            if not result or result not in WASTE_INFO:
                result = "Uncertain"
                explanation = "Could not confidently classify this waste. Please ensure the image is clear and well-lit."
                confidence = "low"

        return {"waste_type": result, "explanation": explanation, "confidence": confidence}

    except Exception as e:
        logger.error(f"Error during waste classification: {str(e)}")
        return {"error": f"Waste classification failed: {str(e)}"}