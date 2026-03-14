from django.contrib import admin
from django.urls import path
from posters import views

# 引入這兩個是用來處理圖片的
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('api/posters/', views.get_posters_api, name='api'),
    path('api/rate/', views.rate_user_api, name='rate_user'), # 新增這行
]

# 這一行才是正確的寫法 (把原本的 ... 換成真的參數)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)