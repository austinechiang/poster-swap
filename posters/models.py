from django.db import models
from django.contrib.auth.models import User

# --- 新增：擴充使用者模型，加入信用系統 ---
class UserProfile(models.Model):
    # OneToOneField 代表一個 User 對應一個 Profile
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # 信用分數 (預設給 5.0 滿分)
    rating = models.FloatField(default=5.0, verbose_name="信用評分")
    
    # 成功交換次數 (預設為 0)
    trade_count = models.IntegerField(default=0, verbose_name="成功交換次數")

    def __str__(self):
        return f"{self.user.username} 的信用檔案 (評分: {self.rating})"

# 原本的海報模型
class Poster(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="持有者")
    movie_name = models.CharField(max_length=100, verbose_name="電影名稱")
    image = models.ImageField(upload_to='posters/', verbose_name="海報照片")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="上傳時間")
    wanted_movie = models.CharField(max_length=100, verbose_name="想交換的電影")
    is_exchanged = models.BooleanField(default=False, verbose_name="是否已交換")

    def __str__(self):
        return f"{self.owner.username} 的《{self.movie_name}》"
