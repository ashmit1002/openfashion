import re
import os
from typing import Optional
from fastapi import HTTPException, UploadFile

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username(username: str) -> bool:
    """Validate username format"""
    # Username should be 3-30 characters, alphanumeric and underscores only
    pattern = r'^[a-zA-Z0-9_]{3,30}$'
    return bool(re.match(pattern, username))

def validate_password_strength(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        return False
    
    # Check for at least one uppercase, one lowercase, one digit
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    return has_upper and has_lower and has_digit

def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        return False
    
    # Check file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        return False
    
    # Check MIME type
    allowed_mime_types = {
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/gif', 'image/webp'
    }
    if file.content_type not in allowed_mime_types:
        return False
    
    return True

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove or replace dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    return filename

def validate_url(url: str) -> bool:
    """Validate URL format"""
    pattern = r'^https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$'
    return bool(re.match(pattern, url))

def validate_price(price: str) -> bool:
    """Validate price format"""
    # Allow formats like "29.99", "29", "$29.99"
    pattern = r'^\$?\d+(?:\.\d{1,2})?$'
    return bool(re.match(pattern, price))

def validate_category(category: str) -> bool:
    """Validate clothing category"""
    allowed_categories = {
        'shirts', 'pants', 'dresses', 'skirts', 'shoes', 'accessories',
        'outerwear', 'underwear', 'sportswear', 'formal', 'casual'
    }
    return category.lower() in allowed_categories

def validate_color(color: str) -> bool:
    """Validate color format (hex or name)"""
    # Hex color validation
    hex_pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    if re.match(hex_pattern, color):
        return True
    
    # Basic color name validation (you can expand this)
    color_names = {
        'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
        'pink', 'purple', 'orange', 'brown', 'navy', 'beige', 'cream'
    }
    return color.lower() in color_names 