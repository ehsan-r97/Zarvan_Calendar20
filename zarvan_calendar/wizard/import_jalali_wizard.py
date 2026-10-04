# -*- coding: utf-8 -*-
"""
Import Jalali Holidays Wizard - Odoo 19
Lightweight, native CSV/Excel import without heavy Pandas dependency.
"""

import logging
import io
import csv
import base64
from datetime import datetime

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError

_logger = logging.getLogger(__name__)


class ImportJalaliWizard(models.TransientModel):
    _name = 'jalaali.import.wizard'
    _description = 'Import Jalali Holidays Wizard'

    file_data = fields.Binary(string='File', required=True)
    filename = fields.Char(string='Filename')

    delimiter = fields.Selection(
        [(',', 'Comma (,)'), (';', 'Semicolon (;)'), ('\t', 'Tab')],
        string='Delimiter',
        default=','
    )
    has_header = fields.Boolean(string='Has Header Row', default=True)

    date_format_mode = fields.Selection([
        ('auto', 'Auto-detect (<1500 = Jalali)'),
        ('jalali', 'Force Jalali'),
        ('gregorian', 'Force Gregorian'),
    ], string='Date Format', default='auto')

    encoding = fields.Selection([
        ('utf-8', 'UTF-8'),
        ('utf-8-sig', 'UTF-8 with BOM'),
        ('cp1256', 'Windows Persian/Arabic (CP1256)'),
    ], string='File Encoding', default='utf-8')

    preview_data = fields.Text(string='Preview Data', readonly=True)
    total_rows = fields.Integer(string='Total Rows', readonly=True)
    valid_rows = fields.Integer(string='Valid Rows', readonly=True)
    invalid_rows = fields.Integer(string='Invalid Rows', readonly=True)

    force_import = fields.Boolean(
        string='Force Import',
        default=False,
        help="Skip invalid rows instead of failing the entire import transaction."
    )

    company_id = fields.Many2one(
        'res.company',
        string='Company',
        default=lambda self: self.env.company,
    )
    create_company_specific = fields.Boolean(string='Create as Company-Specific', default=False)
    holiday_type = fields.Selection([
        ('fixed', 'Fixed Date'),
        ('lunar', 'Lunar / Islamic'),
        ('regional', 'Regional'),
        ('national', 'National Official'),
    ], string='Holiday Type', default='national')

    state = fields.Selection([
        ('draft', 'Draft'),
        ('preview', 'Preview'),
        ('done', 'Done'),
    ], default='draft')

    import_log = fields.Text(string='Import Log', readonly=True)

    def _read_rows(self):
        """Reads CSV or Excel file data natively without pandas."""
        if not self.file_data:
            return []

        raw_bytes = base64.b64decode(self.file_data)
        rows = []

        if self.filename and (self.filename.lower().endswith('.xlsx') or self.filename.lower().endswith('.xls')):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(raw_bytes), data_only=True)
                ws = wb.active
                for row in ws.iter_rows(values_only=True):
                    if any(cell is not None for cell in row):
                        rows.append([str(c).strip() if c is not None else '' for c in row])
            except ImportError:
                raise UserError(_("openpyxl is required to import Excel files. Please install: pip install openpyxl"))
        else:
            # CSV file parsing
            decoded_text = None
            for enc in [self.encoding, 'utf-8-sig', 'utf-8', 'cp1256', 'latin-1']:
                try:
                    decoded_text = raw_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue

            if decoded_text is None:
                raise ValidationError(_("Could not decode file with selected encoding."))

            reader = csv.reader(io.StringIO(decoded_text), delimiter=self.delimiter)
            for r in reader:
                if any(cell.strip() for cell in r):
                    rows.append([c.strip() for c in r])

        return rows

    @api.onchange('file_data')
    def _onchange_file_data(self):
        if not self.file_data:
            return

        rows = self._read_rows()
        if not rows:
            return

        start_idx = 1 if self.has_header and len(rows) > 1 else 0
        data_rows = rows[start_idx:]

        preview_lines = []
        if self.has_header and rows:
            preview_lines.append("Header: " + " | ".join(rows[0]))
            preview_lines.append("-" * 40)

        for r in data_rows[:8]:
            preview_lines.append(" | ".join(r))

        if len(data_rows) > 8:
            preview_lines.append(f"... and {len(data_rows) - 8} more rows")

        self.preview_data = "\n".join(preview_lines)
        self.total_rows = len(data_rows)
        self.state = 'preview'

    def action_import(self):
        """Executes the import transaction."""
        self.ensure_one()
        rows = self._read_rows()
        if not rows:
            raise ValidationError(_("No data found in uploaded file."))

        start_idx = 1 if self.has_header and len(rows) > 1 else 0
        data_rows = rows[start_idx:]

        holiday_model = self.env['jalaali.holiday']
        mixin = self.env['jalaali.mixin']

        created_count = 0
        skipped_count = 0
        errors = []

        with self.env.cr.savepoint():
            for idx, row in enumerate(data_rows, start=1):
                try:
                    if len(row) < 3:
                        raise ValueError(_("Row has fewer than 3 columns."))

                    name = row[0]
                    # Format: Name, Year, Month, Day OR Name, Month, Day
                    if len(row) >= 4:
                        y_val = row[1].strip()
                        year = int(y_val) if y_val and y_val not in ('-', 'null', 'None') else None
                        month = int(row[2])
                        day = int(row[3])
                    else:
                        year = None
                        month = int(row[1])
                        day = int(row[2])

                    # Validate date
                    check_year = year or 1405
                    if not mixin.validate_jalali_date(check_year, month, day):
                        raise ValueError(_("Invalid Jalali date: %s/%s/%s") % (day, month, check_year))

                    # Duplicate check
                    existing = holiday_model.search([
                        ('jalali_year', '=', year),
                        ('jalali_month', '=', month),
                        ('jalali_day', '=', day),
                        ('company_id', '=', self.company_id.id if self.create_company_specific else False),
                    ], limit=1)

                    if existing:
                        skipped_count += 1
                        continue

                    holiday_model.create({
                        'name': name,
                        'jalali_year': year,
                        'jalali_month': month,
                        'jalali_day': day,
                        'holiday_type': 'regional' if self.create_company_specific else self.holiday_type,
                        'company_id': self.company_id.id if self.create_company_specific else False,
                        'description': f"Imported from {self.filename or 'file'}",
                    })
                    created_count += 1

                except Exception as e:
                    err_msg = f"Row {idx}: {str(e)}"
                    errors.append(err_msg)
                    if not self.force_import:
                        raise ValidationError(err_msg)
                    skipped_count += 1

        self.import_log = f"Created: {created_count}, Skipped/Errors: {skipped_count}\n" + "\n".join(errors[:10])
        self.state = 'done'

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Import Complete'),
                'message': _('Created %d holidays, skipped %d.') % (created_count, skipped_count),
                'type': 'success',
                'sticky': False,
            }
        }
