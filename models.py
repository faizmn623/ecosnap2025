from app import db
from datetime import datetime

class Classification(db.Model):
    """Model for storing waste classification results"""
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    waste_type = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.String(20))
    explanation = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model instance to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'filename': self.filename,
            'waste_type': self.waste_type,
            'confidence': self.confidence,
            'explanation': self.explanation,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }