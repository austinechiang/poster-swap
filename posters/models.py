from django.db import models
from django.contrib.auth.models import User

class Poster(models.Model):
    # 1. 誰持有的？ (連結到使用者系統)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="持有者")
    
    # 2. 電影名稱
    movie_name = models.CharField(max_length=100, verbose_name="電影名稱")
    
    # 3. 海報照片 (會自動存到 posters/ 資料夾下)
    image = models.ImageField(upload_to='posters/', verbose_name="海報照片")
    
    # 4. 上傳時間 (自動記錄當下時間)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="上傳時間")

    # 5. 想交換什麼電影？
    wanted_movie = models.CharField(max_length=100, verbose_name="想交換的電影")
    
    # 6. 交換狀態 (預設是 False，代表還沒換出去)
    is_exchanged = models.BooleanField(default=False, verbose_name="是否已交換")

    def __str__(self):
        return f"{self.owner.username} 的《{self.movie_name}》"
