from django.contrib import admin
from .models import Poster

# 修正點：這裡是 admin.ModelAdmin，把中間的 .site 拿掉
@admin.register(Poster)
class PosterAdmin(admin.ModelAdmin):
    # 這裡列出的欄位，會直接變成後台的表格標題！
    list_display = ('movie_name', 'owner', 'wanted_movie', 'is_exchanged', 'created_at')
    
    # 這裡設定可以搜尋的欄位
    search_fields = ('movie_name', 'wanted_movie')
    
    # 這裡設定可以用什麼條件來過濾資料
    list_filter = ('is_exchanged', 'created_at')