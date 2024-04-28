# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

# Create your models here.

class UserProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    #__PROFILE_FIELDS__

    #__PROFILE_FIELDS__END

    def __str__(self):
        return self.user.username
    
    class Meta:
        verbose_name        = _("UserProfile")
        verbose_name_plural = _("UserProfile")

#__MODELS__
class Location(models.Model):

    #__Location_FIELDS__
    id = models.CharField(max_length=255, null=True, blank=True)
    street_line_1 = models.CharField(max_length=255, null=True, blank=True)
    street_line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=255, null=True, blank=True)
    state_code = models.CharField(max_length=255, null=True, blank=True)
    country_code = models.CharField(max_length=255, null=True, blank=True)

    #__Location_FIELDS__END

    class Meta:
        verbose_name        = _("Location")
        verbose_name_plural = _("Location")


class Incident(models.Model):

    #__Incident_FIELDS__
    common_place_name = models.CharField(max_length=255, null=True, blank=True)
    agency_id = models.CharField(max_length=255, null=True, blank=True)
    id = models.CharField(max_length=255, null=True, blank=True)
    incident_type = models.CharField(max_length=255, null=True, blank=True)
    call_type = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    medical_emergency_address = models.CharField(max_length=255, null=True, blank=True)
    street_address = models.CharField(max_length=255, null=True, blank=True)
    address_line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    state_code = models.CharField(max_length=255, null=True, blank=True)
    county = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)
    country_code = models.CharField(max_length=255, null=True, blank=True)
    postcode = models.CharField(max_length=255, null=True, blank=True)
    housenumber = models.CharField(max_length=255, null=True, blank=True)
    formatted_address = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    timezone = models.CharField(max_length=255, null=True, blank=True)

    #__Incident_FIELDS__END

    class Meta:
        verbose_name        = _("Incident")
        verbose_name_plural = _("Incident")


class User(models.Model):

    #__User_FIELDS__
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    street_line_1  = models.CharField(max_length=255, null=True, blank=True)
    street_line_2  = models.CharField(max_length=255, null=True, blank=True)
    city  = models.CharField(max_length=255, null=True, blank=True)
    postal_code  = models.CharField(max_length=255, null=True, blank=True)
    state_code  = models.CharField(max_length=255, null=True, blank=True)
    linkedin  = models.CharField(max_length=255, null=True, blank=True)
    website  = models.CharField(max_length=255, null=True, blank=True)
    license  = models.CharField(max_length=255, null=True, blank=True)
    license_state  = models.CharField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)

    #__User_FIELDS__END

    class Meta:
        verbose_name        = _("User")
        verbose_name_plural = _("User")


class Company(models.Model):

    #__Company_FIELDS__
    id = models.CharField(max_length=255, null=True, blank=True)
    company_domain_name = models.CharField(max_length=255, null=True, blank=True)
    industry = models.CharField(max_length=255, null=True, blank=True)
    street_line_1 = models.CharField(max_length=255, null=True, blank=True)
    street_line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    linkedin_company_page = models.CharField(max_length=255, null=True, blank=True)
    website = models.CharField(max_length=255, null=True, blank=True)
    facebook_company_page = models.CharField(max_length=255, null=True, blank=True)

    #__Company_FIELDS__END

    class Meta:
        verbose_name        = _("Company")
        verbose_name_plural = _("Company")


class Contact(models.Model):

    #__Contact_FIELDS__
    id = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    firstname = models.CharField(max_length=255, null=True, blank=True)
    middlename = models.CharField(max_length=255, null=True, blank=True)
    lastname = models.CharField(max_length=255, null=True, blank=True)
    age_range = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    contact_type = models.CharField(max_length=255, null=True, blank=True)
    street_line_1 = models.CharField(max_length=255, null=True, blank=True)
    street_line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=255, null=True, blank=True)
    state_code = models.CharField(max_length=255, null=True, blank=True)
    country_code = models.CharField(max_length=255, null=True, blank=True)
    lead_status = models.CharField(max_length=255, null=True, blank=True)

    #__Contact_FIELDS__END

    class Meta:
        verbose_name        = _("Contact")
        verbose_name_plural = _("Contact")


class Deal(models.Model):

    #__Deal_FIELDS__
    id = models.CharField(max_length=255, null=True, blank=True)
    deal_name = models.CharField(max_length=255, null=True, blank=True)
    deal_stage = models.CharField(max_length=255, null=True, blank=True)

    #__Deal_FIELDS__END

    class Meta:
        verbose_name        = _("Deal")
        verbose_name_plural = _("Deal")



#__MODELS__END
