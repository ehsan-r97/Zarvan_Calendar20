# -*- coding: utf-8 -*-
"""
Search Patch Module (Unified into base_model_patch) - Odoo 20
Maintained for backwards-compatibility imports.
"""

from .base_model_patch import (
    PERSIAN_AND_ARABIC_DIGITS,
    _normalize_persian_str,
    _convert_single_date,
    BaseModelJalaaliPatch,
    BaseModelJalaaliPatch as BaseModelJalaaliSearch,
    BaseModelJalaaliPatch as BaseModelSearchJalaliPatch,
)
