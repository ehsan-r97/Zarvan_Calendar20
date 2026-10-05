# -*- coding: utf-8 -*-
from odoo.tests import common, tagged
from datetime import date


@tagged('post_install', '-at_install')
class TestJalaaliMixin(common.TransactionCase):
    """Test cases for Jalaali Mixin conversion logic."""

    def setUp(self):
        super().setUp()
        self.mixin_model = self.env['jalaali.mixin']

    def test_jalali_to_gregorian_basic(self):
        """Test basic Jalali to Gregorian conversion."""
        # 1403-01-17 should be 2024-04-05
        result = self.mixin_model._jalali_to_gregorian('1403-01-17')
        self.assertEqual(result, date(2024, 4, 5))

    def test_jalali_to_gregorian_with_slashes(self):
        """Test conversion with slash separator."""
        result = self.mixin_model._jalali_to_gregorian('1403/01/17')
        self.assertEqual(result, date(2024, 4, 5))

    def test_jalali_to_gregorian_invalid(self):
        """Test invalid Jalali date returns None."""
        result = self.mixin_model._jalali_to_gregorian('1403-13-01')  # Invalid month
        self.assertIsNone(result)

    def test_gregorian_to_jalali_basic(self):
        """Test basic Gregorian to Jalali conversion."""
        result = self.mixin_model._gregorian_to_jalali(date(2024, 4, 5))
        self.assertEqual(result, '1403-01-17')

    def test_gregorian_to_jalali_datetime(self):
        """Test conversion with datetime object."""
        from datetime import datetime
        dt = datetime(2024, 4, 5, 10, 30, 0)
        result = self.mixin_model._gregorian_to_jalali(dt)
        self.assertEqual(result, '1403-01-17')

    def test_validate_jalali_valid(self):
        """Test validation of valid Jalali date."""
        # Should not raise any exception
        result = self.mixin_model._validate_jalali_date('1403-01-17', 'Test Date')
        self.assertTrue(result)

    def test_validate_jalali_invalid(self):
        """Test validation raises error for invalid date."""
        from odoo.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            self.mixin_model._validate_jalali_date('1403-13-01', 'Test Date')

    def test_leap_year_validation(self):
        """Test leap year validation (Esfand 30)."""
        # 1403 is a leap year in Jalali calendar
        result = self.mixin_model._jalali_to_gregorian('1403-12-30')
        self.assertIsNotNone(result)
        
        # 1402 is not a leap year
        result_invalid = self.mixin_model._jalali_to_gregorian('1402-12-30')
        self.assertIsNone(result_invalid)
