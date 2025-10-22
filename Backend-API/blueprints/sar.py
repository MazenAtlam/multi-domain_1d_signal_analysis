"""SAR (Specific Absorption Rate) Data Generator Blueprint"""
from flask import Blueprint, jsonify
import numpy as np
import math

# إنشاء Blueprint لتنظيم الـ endpoints الخاصة بالـ SAR
sar_bp = Blueprint('sar', __name__)

# =======================================================
# دالة توليد وتحليل بيانات SAR
# =======================================================

def generate_and_analyze_sar_data():
    """
    Generates a simulated 2D SAR map and calculates safety margin info.
    SAR_LIMIT (1.6 W/kg) is based on FCC regulations for 1g of tissue.
    """
    
    # 1. إعداد الثوابت
    SIZE = 50           # حجم المصفوفة 50x50 بكسل
    SAR_LIMIT = 1.6     # الحد التنظيمي لـ SAR (واط/كجم)
    
    # 2. توليد مصفوفة SAR فارغة
    sar_data = np.zeros((SIZE, SIZE))

    # 3. إضافة نقاط ساخنة مُحاكاة (تمثيل مصادر RF) باستخدام دالة جاوس
    
    # النقطة الساخنة الأولى (قوية)
    center1 = (15, 20)
    sigma1 = 5
    for i in range(SIZE):
        for j in range(SIZE):
            dist = np.sqrt((i - center1[0])**2 + (j - center1[1])**2)
            # قوة الامتصاص هنا 0.8
            sar_data[i, j] += 0.8 * np.exp(-(dist**2) / (2 * sigma1**2))

    # النقطة الساخنة الثانية (أضعف)
    center2 = (35, 40)
    sigma2 = 8
    for i in range(SIZE):
        for j in range(SIZE):
            dist = np.sqrt((i - center2[0])**2 + (j - center2[1])**2)
            # قوة الامتصاص هنا 0.3
            sar_data[i, j] += 0.3 * np.exp(-(dist**2) / (2 * sigma2**2))

    # 4. تحديد قيمة قصوى محاكاة في السيناريو (Max Measured SAR)
    max_measured_sar = np.clip(sar_data, 0, 1.8).max()
    
    # 5. استخلاص وتحليل المعلومات
    
    is_safe = max_measured_sar <= SAR_LIMIT
    
    if is_safe:
        status = "✅ ضمن حد الأمان."
        margin_percent = ((SAR_LIMIT - max_measured_sar) / SAR_LIMIT) * 100
        analysis_detail = f"هامش أمان: {margin_percent:.2f}% أقل من الحد."
    else:
        status = "⚠️ تجاوز حد الأمان!"
        margin_percent = ((max_measured_sar - SAR_LIMIT) / SAR_LIMIT) * 100
        analysis_detail = f"تجاوز الحد بنسبة: {margin_percent:.2f}%."


    # 6. تجهيز البيانات للإرسال عبر JSON
    return {
        "sar_map": sar_data.tolist(),       # تحويل مصفوفة NumPy إلى قائمة قوائم للـ JSON
        "max_sar_measured": round(float(max_measured_sar), 2),
        "sar_limit": SAR_LIMIT,
        "is_safe": is_safe,
        "status": status,
        "analysis_detail": analysis_detail,
        "map_size": SIZE
    }

# =======================================================
# نقطة النهاية (Endpoint) للوصول إلى بيانات SAR
# =======================================================

@sar_bp.route('/data', methods=['GET'])
def get_sar_data():
    """
    API endpoint to retrieve the simulated SAR map data and analysis.
    """
    try:
        data = generate_and_analyze_sar_data()
        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to generate SAR data: " + str(e)
        }), 500

@sar_bp.route('/info', methods=['GET'])
def sar_info():
    """Return SAR API information"""
    return jsonify({
        'status': 'running',
        'project': 'SAR/Cosmic Signals Viewer',
        'unit': 'Specific Absorption Rate (W/kg)',
        'endpoints': {
            '/api/sar/data': 'GET - Retrieve simulated SAR map and analysis.',
            '/api/sar/info': 'GET - API information.'
        },
        'analysis_metric': 'Safety Margin vs FCC Limit (1.6 W/kg)'
    })