from flask import Flask, render_template, request, jsonify, redirect, session
import datetime
import os
import re
from werkzeug.utils import secure_filename
import random
import json
import string
from dotenv import load_dotenv
from database import setup_db, get_connection

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-123456789')

# База данных пользователей больше не нужна для авторизации,
# но оставим для временного хранения измерений
USERS_DB = 'users.db'

# ------------------ Инициализация ------------------

def ensure_storage():
    avatars_dir = os.path.join('static', 'avatars')
    if not os.path.exists(avatars_dir):
        os.makedirs(avatars_dir, exist_ok=True)

setup_db()
ensure_storage()

# ------------------ Вспомогательные функции ------------------

def load_shoes_database():
    try:
        with open('base_of_shoes.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"sneakers": []}

def calculate_compatibility(user_data, shoe_size, is_sport=1):
    compatibility = 0
    factors = 0

    has_length = user_data.get('foot_length') and str(user_data['foot_length']).strip()
    has_width = user_data.get('foot_width') and str(user_data['foot_width']).strip()
    has_oblique = user_data.get('oblique_circumference') and str(user_data['oblique_circumference']).strip()
    has_foot_type = user_data.get('foot_type') and user_data['foot_type'].strip()

    if has_length:
        try:
            user_length = float(user_data['foot_length']) * 10
            shoe_length = shoe_size['length']
            user_length += 10 if is_sport == 1 else 15
            length_diff = abs(user_length - shoe_length)
            if length_diff <= 3:
                length_score = 45
            elif length_diff <= 7:
                length_score = 40
            elif length_diff <= 12:
                length_score = 35
            elif length_diff <= 17:
                length_score = 25
            elif length_diff <= 22:
                length_score = 15
            else:
                length_score = 5
            compatibility += length_score
            factors += 46
        except ValueError:
            pass

    if has_width:
        try:
            user_width = float(user_data['foot_width']) * 10
            estimated_midfoot = 2 * (user_width + 50) * 0.9
            user_width += 10 if is_sport == 1 else 15
            shoe_midfoot = shoe_size['midfootCircumference']
            width_diff = abs(estimated_midfoot - shoe_midfoot)
            if width_diff <= 15:
                width_score = 35
            elif width_diff <= 25:
                width_score = 30
            elif width_diff <= 35:
                width_score = 25
            elif width_diff <= 45:
                width_score = 18
            elif width_diff <= 55:
                width_score = 10
            else:
                width_score = 5
            compatibility += width_score
            factors += 29
        except ValueError:
            pass

    if has_oblique:
        try:
            user_oblique = float(user_data['oblique_circumference']) * 10
            shoe_oblique = shoe_size['obliqueCircumference']
            user_oblique += 10 if is_sport == 1 else 15
            oblique_diff = abs(user_oblique - shoe_oblique)
            if oblique_diff <= 10:
                oblique_score = 15
            elif oblique_diff <= 20:
                oblique_score = 12
            elif oblique_diff <= 30:
                oblique_score = 8
            elif oblique_diff <= 40:
                oblique_score = 5
            else:
                oblique_score = 2
            compatibility += oblique_score
            factors += 17
        except ValueError:
            pass

    if has_foot_type:
        foot_type = user_data['foot_type']
        if foot_type == 'Плоскостопие':
            ankle_circ = shoe_size['ankleCircumference']
            midfoot_circ = shoe_size['midfootCircumference']
            foot_type_score = 5 if ankle_circ > 240 and midfoot_circ > 220 else 3 if ankle_circ > 230 and midfoot_circ > 210 else 1
        elif foot_type == 'Супинация':
            toe_circ = shoe_size['toeCircumference']
            foot_type_score = 5 if toe_circ > 240 else 3 if toe_circ > 220 else 1
        else:
            foot_type_score = 4
        compatibility += foot_type_score
        factors += 8

    final_compatibility = min(98, int(compatibility * 100 / factors)) if factors > 0 else 0

    if has_length:
        user_length = float(user_data['foot_length']) * 10
        shoe_length = shoe_size['length'] + (4 if is_sport == 1 else 6)
        if abs(user_length - shoe_length) <= 2:
            final_compatibility = min(100, final_compatibility + 5)

    return final_compatibility

def find_best_matches(user_data):
    if not user_data:
        return []

    shoes_db = load_shoes_database()
    recommendations = []

    for shoe in shoes_db['sneakers']:
        best_compatibility = 0
        best_size = None
        for size in shoe['sizes']:
            compatibility = calculate_compatibility({
                'foot_length': user_data.get('foot_length'),
                'foot_width': user_data.get('foot_width'),
                'oblique_circumference': user_data.get('oblique_circumference'),
                'foot_type': user_data.get('foot_type')
            }, size, is_sport=shoe.get('sport', 1))
            if compatibility > best_compatibility:
                best_compatibility = compatibility
                best_size = size
        if best_compatibility >= 30:
            recommendations.append({
                'model': shoe['model'],
                'compatibility': best_compatibility,
                'best_size': best_size,
                'all_sizes': shoe['sizes']
            })
    recommendations.sort(key=lambda x: x['compatibility'], reverse=True)
    return recommendations[:8]

# Хранилище данных пользователей по сессии
user_measurements_store = {}

def get_user_measurements():
    """Получает измерения пользователя из сессии"""
    session_id = session.get('session_id')
    if session_id and session_id in user_measurements_store:
        return user_measurements_store[session_id]
    return None

def save_user_measurements(data):
    """Сохраняет измерения пользователя в сессию"""
    if 'session_id' not in session:
        session['session_id'] = os.urandom(16).hex()
    user_measurements_store[session['session_id']] = data

# ------------------ Роуты ------------------

@app.route('/')
def first():
    return render_template('first_page.html')

@app.route('/shoe/<model_name>')
def shoe_detail(model_name):
    shoes_db = load_shoes_database()
    shoe = None
    for s in shoes_db['sneakers']:
        if s['model'] == model_name:
            shoe = s
            break
    if not shoe:
        return "Модель не найдена", 404

    user_data = get_user_measurements()

    all_sizes = []
    best_compatibility = 0
    best_size_eu = None
    
    for size in shoe['sizes']:
        compatibility = calculate_compatibility({
            'foot_length': user_data.get('foot_length') if user_data else None,
            'foot_width': user_data.get('foot_width') if user_data else None,
            'oblique_circumference': user_data.get('oblique_circumference') if user_data else None,
            'foot_type': user_data.get('foot_type') if user_data else None
        }, size, is_sport=shoe.get('sport', 1))
        
        if compatibility > best_compatibility:
            best_compatibility = compatibility
            best_size_eu = size['eu']

        all_sizes.append({
            'size_data': size,
            'compatibility': compatibility,
            'eu': size['eu']
        })
    
    sorted_by_compatibility = sorted(all_sizes, key=lambda x: x['compatibility'], reverse=True)
    
    for size in sorted_by_compatibility:
        size['is_best'] = (size['size_data']['eu'] == best_size_eu)
    
    all_sizes_sorted_by_eu = sorted(all_sizes, key=lambda x: x['eu'])

    return render_template('shoe_detail.html',
                           shoe=shoe, 
                           top_sizes=sorted_by_compatibility[:5],   
                           all_sizes=all_sizes_sorted_by_eu,
                           all_sizes_count=len(shoe['sizes']),
                           user=user_data)

@app.route('/get_shoe_type')
def get_shoe_type():
    model_name = request.args.get('model', '')
    shoes_db = load_shoes_database()

    for shoe in shoes_db['sneakers']:
        if shoe['model'] == model_name:
            shoe_type = 'sport' if shoe.get('sport', 1) == 1 else 'casual'
            return jsonify({'shoeType': shoe_type})

    return jsonify({'shoeType': 'sport'})

@app.route('/measure', methods=['GET', 'POST'])
def measure():
    user_data = get_user_measurements()
    
    if request.method == 'POST':
        length = request.form.get('length', '').strip()
        width = request.form.get('width', '').strip()
        oblique_circumference = request.form.get('oblique_circumference', '').strip()
        foot_type = request.form.get('foot_type', '').strip()
        
        errors = []
        try:
            oblique_float = float(oblique_circumference)
            if oblique_float < 20 or oblique_float > 50:
                errors.append("Косой обхват должен быть от 20 до 50 см")
        except:
            errors.append("Некорректное значение косого обхвата")
            
        if not foot_type:
            errors.append("Выберите тип стопы")
            
        if errors:
            return render_template('measure.html', user_measurements=user_data, errors=errors)
        
        save_user_measurements({
            'foot_length': length,
            'foot_width': width,
            'oblique_circumference': oblique_circumference,
            'foot_type': foot_type
        })
        
        return redirect('/fit')
    
    return render_template('measure.html', user_measurements=user_data, errors=[])

@app.route('/get_recommendations')
def get_recommendations():
    user_data = get_user_measurements()
    if not user_data:
        return jsonify([])
    
    recommendations = find_best_matches(user_data)
    return jsonify(recommendations)

@app.route('/fit')
def fit():
    return render_template('fit.html')

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/how')
def how():
    return render_template("how.html")

@app.route('/get_random_shoe')
def get_random_shoe():
    try:
        shoes_db = load_shoes_database()
        if not shoes_db.get('sneakers'):
            return jsonify({'error': 'No shoes available'})
        random_shoe = random.choice(shoes_db['sneakers'])
        return jsonify({
            'model': random_shoe['model'],
            'sizes_available': len(random_shoe['sizes'])
        })
    except Exception as e:
        print(f"Error getting random shoe: {e}")
        return jsonify({'error': 'Failed to load shoe data'})

@app.route('/clear_measurements', methods=['POST'])
def clear_measurements():
    """Очищает данные измерений пользователя"""
    session_id = session.get('session_id')
    if session_id and session_id in user_measurements_store:
        del user_measurements_store[session_id]
    return jsonify({'success': True, 'message': 'Данные очищены'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
