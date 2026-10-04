# -*- coding: utf-8 -*-
"""
Jalali Holiday Model - Odoo 19
Stores national, lunar, fixed, and regional holidays.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class JalaaliHoliday(models.Model):
    _name = 'jalaali.holiday'
    _description = 'Jalali Calendar Holiday'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'jalali_year desc, jalali_month asc, jalali_day asc'

    name = fields.Char(string='Holiday Name', required=True, tracking=True)
    jalali_year = fields.Integer(
        string='Jalali Year',
        help="Leave empty for fixed holidays that apply every year (e.g. Nowruz)",
        tracking=True
    )
    jalali_month = fields.Integer(string='Jalali Month', required=True)
    jalali_day = fields.Integer(string='Jalali Day', required=True)

    holiday_type = fields.Selection([
        ('fixed', 'Fixed Date (Solar)'),
        ('lunar', 'Lunar (Islamic Rotating)'),
        ('regional', 'Company / Regional'),
        ('national', 'National Official'),
    ], string='Holiday Type', default='fixed', required=True)

    is_national = fields.Boolean(string='National Holiday', default=True)
    active = fields.Boolean(string='Active', default=True)
    is_active = fields.Boolean(string='Active', related='active', readonly=False)
    description = fields.Text(string='Description')

    company_id = fields.Many2one(
        'res.company',
        string='Company',
        default=lambda self: self.env.company,
        help="Leave blank for holidays that apply to all companies."
    )

    display_name = fields.Char(compute='_compute_display_name', store=True)

    # FIXED: Include jalali_year in unique constraint so lunar holidays in different years do not conflict!
    _sql_constraints = [
        (
            'unique_holiday_date',
            'unique(jalali_year, jalali_month, jalali_day, holiday_type, company_id)',
            'A holiday for this date, type, year, and company already exists!'
        ),
    ]

    @api.depends('name', 'jalali_year', 'jalali_month', 'jalali_day')
    def _compute_display_name(self):
        """Standard Odoo 17/18/19 display name compute method."""
        for rec in self:
            year_str = f" ({rec.jalali_year})" if rec.jalali_year else " (Every Year)"
            rec.display_name = f"{rec.name} - {rec.jalali_month:02d}/{rec.jalali_day:02d}{year_str}"

    @api.constrains('jalali_month', 'jalali_day', 'jalali_year')
    def _check_valid_date(self):
        mixin = self.env['jalaali.mixin']
        for rec in self:
            check_year = rec.jalali_year or 1405
            if not mixin.validate_jalali_date(check_year, rec.jalali_month, rec.jalali_day):
                raise ValidationError(
                    _("Invalid Jalali date: %s/%s/%s") % (rec.jalali_day, rec.jalali_month, rec.jalali_year or 'Any')
                )

    @api.constrains('jalali_year', 'jalali_month', 'jalali_day', 'holiday_type', 'company_id')
    def _check_unique_holiday(self):
        """Cross-database Python constraint ensuring uniqueness even with NULL years/companies."""
        for rec in self:
            domain = [
                ('id', '!=', rec.id),
                ('jalali_year', '=', rec.jalali_year),
                ('jalali_month', '=', rec.jalali_month),
                ('jalali_day', '=', rec.jalali_day),
                ('holiday_type', '=', rec.holiday_type),
                ('company_id', '=', rec.company_id.id),
            ]
            if self.search_count(domain):
                raise ValidationError(
                    _("A holiday for this date, type, year, and company already exists: %s (%s/%s)")
                    % (rec.name, rec.jalali_month, rec.jalali_day)
                )
