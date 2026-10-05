# -*- coding: utf-8 -*-
"""
Jalali RESTful API Controller for Odoo 20
Provides high-speed endpoints for external systems (Mobile apps, eCommerce, Microservices).
Supports both GET and POST requests cleanly using standard REST conventions.
"""

import json
from datetime import datetime, date
from odoo import http, _
from odoo.http import request, Response


def _json_response(data, status=200):
    return Response(
        json.dumps(data, ensure_ascii=False, default=str),
        status=status,
        headers={'Content-Type': 'application/json; charset=utf-8'}
    )


def _get_request_params():
    """Extracts parameters from query string or JSON payload."""
    params = dict(request.httprequest.args)
    if request.httprequest.data:
        try:
            body = json.loads(request.httprequest.data.decode('utf-8'))
            if isinstance(body, dict):
                params.update(body)
        except Exception:
            pass
    return params


class JalaaliApiController(http.Controller):

    @http.route(['/api/jalaali/current', '/api/jalaali/today'], type='http', auth='public', methods=['GET'], csrf=False)
    def api_current(self, **kwargs):
        """Returns today's date in Persian and Gregorian format."""
        try:
            service = request.env['jalaali.service'].sudo()
            today_data = service.get_today_shamsi()
            return _json_response({'success': True, 'data': today_data})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=500)

    @http.route('/api/jalaali/convert/g2j', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def api_convert_g2j(self, **kwargs):
        """Converts Gregorian date (YYYY-MM-DD or year, month, day) to Jalali."""
        try:
            params = _get_request_params()
            service = request.env['jalaali.service'].sudo()

            date_str = params.get('date') or kwargs.get('date')
            if date_str:
                res = service.convert_g2j(date_str)
            else:
                y = int(params.get('year', kwargs.get('year', 0)))
                m = int(params.get('month', kwargs.get('month', 0)))
                d = int(params.get('day', kwargs.get('day', 0)))
                res = service.convert_g2j(y, m, d)

            if not res:
                return _json_response({'success': False, 'error': 'Invalid date provided'}, status=400)
            return _json_response({'success': True, 'data': res})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)

    @http.route('/api/jalaali/convert/j2g', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def api_convert_j2g(self, **kwargs):
        """Converts Jalali date (YYYY/MM/DD or year, month, day) to Gregorian."""
        try:
            params = _get_request_params()
            service = request.env['jalaali.service'].sudo()

            date_str = params.get('date') or kwargs.get('date')
            if date_str:
                res = service.convert_j2g(date_str)
            else:
                y = int(params.get('year', kwargs.get('year', 0)))
                m = int(params.get('month', kwargs.get('month', 0)))
                d = int(params.get('day', kwargs.get('day', 0)))
                res = service.convert_j2g(y, m, d)

            if not res:
                return _json_response({'success': False, 'error': 'Invalid Jalali date provided'}, status=400)
            return _json_response({'success': True, 'data': res})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)

    @http.route('/api/jalaali/convert', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def api_convert(self, **kwargs):
        """Unified conversion endpoint with auto-direction detection."""
        params = _get_request_params()
        direction = params.get('direction', kwargs.get('direction', '')).lower()
        if direction == 'g2j':
            return self.api_convert_g2j(**kwargs)
        elif direction == 'j2g':
            return self.api_convert_j2g(**kwargs)

        # Auto-detect direction by year
        raw = params.get('date') or kwargs.get('date') or str(params.get('year', kwargs.get('year', '')))
        import re
        m = re.search(r'\b(1[3-5]\d{2})\b', raw)
        if m:
            return self.api_convert_j2g(**kwargs)
        return self.api_convert_g2j(**kwargs)

    @http.route('/api/jalaali/holidays', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def api_holidays(self, **kwargs):
        """Retrieves or creates official holidays."""
        try:
            params = _get_request_params()
            holiday_model = request.env['jalaali.holiday'].sudo()

            if request.httprequest.method == 'POST':
                # Create a new holiday record
                name = params.get('name')
                m = int(params.get('month', 0))
                d = int(params.get('day', 0))
                y = int(params.get('year')) if params.get('year') else False
                htype = params.get('holiday_type', 'fixed')
                is_nat = bool(params.get('is_national', True))

                if not name or not (1 <= m <= 12) or not (1 <= d <= 31):
                    return _json_response({'success': False, 'error': 'Missing required fields (name, month, day)'}, status=400)

                rec = holiday_model.create({
                    'name': name,
                    'jalali_year': y,
                    'jalali_month': m,
                    'jalali_day': d,
                    'holiday_type': htype,
                    'is_national': is_nat,
                })
                return _json_response({'success': True, 'data': {'id': rec.id, 'name': rec.name}}, status=201)

            # GET requests
            year = params.get('year') or kwargs.get('year')
            year = int(year) if year else 1405
            service = request.env['jalaali.service'].sudo()
            holidays = service.get_holidays_in_year(year)
            return _json_response({'success': True, 'data': {'year': year, 'holidays': holidays}})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)

    @http.route('/api/jalaali/holidays/<int:year>', type='http', auth='public', methods=['GET'], csrf=False)
    def api_holidays_by_year(self, year, **kwargs):
        """Returns all holidays for a specific Jalali year."""
        try:
            service = request.env['jalaali.service'].sudo()
            holidays = service.get_holidays_in_year(year)
            return _json_response({'success': True, 'data': {'year': year, 'holidays': holidays}})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)

    @http.route('/api/jalaali/working-days', type='http', auth='public', methods=['GET'], csrf=False)
    def api_working_days(self, **kwargs):
        """Calculates working days, weekends, and holidays in a Jalali month."""
        try:
            params = _get_request_params()
            year = int(params.get('year', kwargs.get('year', 1405)))
            month = int(params.get('month', kwargs.get('month', 1)))

            service = request.env['jalaali.service'].sudo()
            data = service.get_working_days_in_month(year, month)
            return _json_response({'success': True, 'data': data})
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)

    @http.route('/api/jalaali/preferences', type='http', auth='user', methods=['GET', 'POST'], csrf=False)
    def api_preferences(self, **kwargs):
        """Retrieves or updates user calendar preferences."""
        try:
            user = request.env.user
            if request.httprequest.method == 'POST':
                params = _get_request_params()
                vals = {}
                if 'mode' in params:
                    vals['jalali_calendar_mode'] = params['mode']
                if 'date_format' in params:
                    vals['jalali_date_format'] = params['date_format']
                if 'use_persian_numbers' in params:
                    vals['jalali_use_persian_numbers'] = bool(params['use_persian_numbers'])
                if vals:
                    user.write(vals)

            return _json_response({
                'success': True,
                'data': {
                    'user_id': user.id,
                    'name': user.name,
                    'jalali_calendar_mode': user.jalali_calendar_mode or 'shamsi',
                    'jalali_date_format': user.jalali_date_format or 'YYYY/MM/DD',
                    'jalali_use_persian_numbers': bool(user.jalali_use_persian_numbers),
                }
            })
        except Exception as e:
            return _json_response({'success': False, 'error': str(e)}, status=400)
