from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import JSONField
from django.utils.translation import gettext_lazy as _

# Create your models here.

class UserProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    #__PROFILE_FIELDS__START
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    #__PROFILE_FIELDS__END

    def __str__(self):
        return self.user.username
    
    class Meta:
        verbose_name        = _("UserProfile")
        verbose_name_plural = _("UserProfile")

#__MODELS__
class Location(models.Model):

    #__Location_FIELDS__START
    id = models.CharField(max_length=255, primary_key=True)
    is_valid = models.BooleanField()
    street_line_1 = models.CharField(max_length=255)
    street_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    zip4 = models.CharField(max_length=20, blank=True, null=True)
    state_code = models.CharField(max_length=10)
    country_code = models.CharField(max_length=10)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_active = models.BooleanField(null=True, blank=True)
    is_commercial = models.BooleanField()
    delivery_point = models.CharField(max_length=100)
    #__Location_FIELDS__END

    contacts = models.ManyToManyField('Contact', related_name='locations')


    class Meta:
        verbose_name        = _("Location")
        verbose_name_plural = _("Location")


class Incident(models.Model):

    #__Incident_FIELDS__START
    id = models.CharField(max_length=255, primary_key=True)
    agency_id = models.CharField(max_length=100)
    common_place_name = models.CharField(max_length=255, blank=True, null=True)
    incident_type = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    public_location = models.BooleanField()
    call_type = models.CharField(max_length=10)
    is_shareable = models.BooleanField(default=True)
    alarm_level = models.IntegerField()
    call_received = models.DateTimeField()
    address = models.CharField(max_length=255)
    medical_emergency_address = models.CharField(max_length=255, blank=True, null=True)
    address_truncated = models.BooleanField(default=False)
    street_address = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    state_code = models.CharField(max_length=10)
    county = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    country_code = models.CharField(max_length=10)
    postcode = models.CharField(max_length=20)
    housenumber = models.CharField(max_length=50, blank=True, null=True)
    formatted_address = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=50)
    units = JSONField() 
    #__Incident_FIELDS__END
    
    #__Incident_Relationships_FIELDS__START
    locations = models.ManyToManyField('Location', related_name='incidents')
    contacts = models.ManyToManyField('Contact', related_name='incidents')
    #__Incident_Relationships_FIELDS__END

    class Meta:
        verbose_name        = _("Incident")
        verbose_name_plural = _("Incident")


class CustomUser(AbstractUser):

    #__User_FIELDS__
    middlename = models.CharField(max_length=30, blank=True, null=True)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    mobile_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    street_line_1 = models.CharField(max_length=255, blank=True, null=True)
    street_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    state_code = models.CharField(max_length=10, blank=True, null=True)
    linkedin = models.URLField(max_length=200, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    license = models.CharField(max_length=50, blank=True, null=True)
    license_state = models.CharField(max_length=50, blank=True, null=True)
    #__User_FIELDS__END

    class Meta:
        verbose_name        = _("User")
        verbose_name_plural = _("User")


class Company(models.Model):

    #__Company_FIELDS__
    id = models.CharField(max_length=255, primary_key=True)
    company_domain_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100, blank=True, null=True)
    street_line_1 = models.CharField(max_length=255)
    street_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    state = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified_date = models.DateTimeField(auto_now=True)
    linkedin_company_page = models.URLField(blank=True, null=True)
    parent_company = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='subsidiaries')
    website = models.URLField(blank=True, null=True)
    facebook_company_page = models.URLField(blank=True, null=True)
    #__Company_FIELDS__END

    class Meta:
        verbose_name        = _("Company")
        verbose_name_plural = _("Company")


class Contact(models.Model):

    #__Contact_FIELDS__
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    firstname = models.CharField(max_length=255, blank=True, null=True)
    middlename = models.CharField(max_length=255, blank=True, null=True)
    lastname = models.CharField(max_length=255, blank=True, null=True)
    age_range = models.CharField(max_length=255, blank=True, null=True)
    gender = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=255, blank=True, null=True)
    contact_type = models.CharField(max_length=255, blank=True, null=True)
    street_line_1 = models.CharField(max_length=255, blank=True, null=True)
    street_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    postal_code = models.CharField(max_length=255, blank=True, null=True)
    state_code = models.CharField(max_length=255, blank=True, null=True)
    country_code = models.CharField(max_length=255, blank=True, null=True)
    lead_status = models.CharField(max_length=255, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='contacts')
    emails = JSONField(blank=True, null=True)
    phones = JSONField(blank=True, null=True) 
    #__Contact_FIELDS__END
    
    #__Contact__Relationship_FIELDS__START
    locations = models.ManyToManyField('Location', related_name='contacts')
    incidents = models.ManyToManyField('Incident', related_name='contacts')
    #__Contact__Relationship_FIELDS__END    

    class Meta:
        verbose_name        = _("Contact")
        verbose_name_plural = _("Contact")


class Deal(models.Model):

    #__Deal_FIELDS__START
    id = models.CharField(max_length=255, primary_key=True)
    deal_name = models.CharField(max_length=255)
    projected_amount = models.DecimalField(max_digits=12, decimal_places=2)
    priority = models.IntegerField()
    create_date = models.DateTimeField(auto_now_add=True)
    close_date = models.DateTimeField(null=True, blank=True)
    deal_stage = models.CharField(max_length=100)
    #__Deal_FIELDS__END
    
    #__Deal_Relationship_FIELDS__START
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_deals', on_delete=models.CASCADE)
    contacts = models.ManyToManyField('Contact', related_name='deals')
    companies = models.ManyToManyField('Company', related_name='deals')
    locations = models.ManyToManyField('Location', related_name='deals')
    incidents = models.ManyToManyField('Incident', related_name='deals')
    #__Deal_Relationship_FIELDS__END

    class Meta:
        verbose_name        = _("Deal")
        verbose_name_plural = _("Deal")


    def __str__(self):
        return self.deal_name

#__MODELS__END
