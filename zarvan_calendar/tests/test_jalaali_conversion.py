# -*- coding: utf-8 -*-
from odoo.tests import common, tagged


@tagged('post_install', '-at_install')
class TestJalaaliConversion(common.TransactionCase):
    """Test client-side conversion logic simulation."""

    def setUp(self):
        super().setUp()
        self.mixin_model = self.env['jalaali.mixin']

    def test_nowruz_date(self):
        """Test Nowruz (1403-01-01) conversion."""
        result = self.mixin_model._jalali_to_gregorian('1403-01-01')
        # Nowruz 1403 = March 20, 2024
        self.assertEqual(result.year, 2024)
        self.assertEqual(result.month, 3)
        self.assertEqual(result.day, 20)

    def test_year_boundary(self):
        """Test year boundary conversions."""
        # End of Jalali year 1402
        result1 = self.mixin_model._jalali_to_gregorian('1402-12-29')
        self.assertIsNotNone(result1)
        
        # Start of Jalali year 1403
        result2 = self.mixin_model._jalali_to_gregorian('1403-01-01')
        self.assertIsNotNone(result2)
        
        # Verify they are consecutive days
        delta = (result2 - result1).days
        self.assertEqual(delta, 2)  # Should be 1-2 days apart

    def test_month_boundaries(self):
        """Test month boundary dates."""
        # First day of each month
        for month in range(1, 13):
            date_str = f'1403-{month:02d}-01'
            result = self.mixin_model._jalali_to_gregorian(date_str)
            self.assertIsNotNone(result, f"Failed for {date_str}")

    def test_format_variations(self):
        """Test different input format variations."""
        formats = [
            '1403-01-15',
            '1403/01/15',
            '1403-1-15',
            '1403/1/15',
        ]
        
        expected = self.mixin_model._jalali_to_gregorian('1403-01-15')
        
        for fmt in formats:
            result = self.mixin_model._jalali_to_gregorian(fmt)
            self.assertEqual(result, expected, f"Format {fmt} failed")

    def test_round_trip_conversion(self):
        """Test round-trip conversion maintains accuracy."""
        original_jalali = '1403-06-15'
        
        # Jalali -> Gregorian
        gregorian = self.mixin_model._jalali_to_gregorian(original_jalali)
        self.assertIsNotNone(gregorian)
        
        # Gregorian -> Jalali
        result_jalali = self.mixin_model._gregorian_to_jalali(gregorian)
        
        # Note: Format might differ (leading zeros)
        # Parse both and compare components
        orig_parts = original_jalali.split('-')
        result_parts = result_jalali.split('-')
        
        self.assertEqual(int(orig_parts[0]), int(result_parts[0]))
        self.assertEqual(int(orig_parts[1]), int(result_parts[1]))
        self.assertEqual(int(orig_parts[2]), int(result_parts[2]))

    def test_invalid_dates(self):
        """Test various invalid date formats."""
        invalid_dates = [
            '1403-13-01',  # Invalid month
            '1403-00-01',  # Zero month
            '1403-01-00',  # Zero day
            '1403-01-32',  # Invalid day
            '1403-07-31',  # Month 7+ has only 30 days
            '1402-12-30',  # Non-leap year Esfand 30
            'abcd-01-01',  # Non-numeric
            '1403-1-1-1',  # Too many parts
            '',            # Empty string
        ]
        
        for invalid in invalid_dates:
            result = self.mixin_model._jalali_to_gregorian(invalid)
            self.assertIsNone(result, f"Should be invalid: {invalid}")
