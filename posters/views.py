from django.shortcuts import render
from django.http import JsonResponse # 引入這個來回傳 JSON
from .models import Poster

def index(request):
    return render(request, 'posters/index.html')

# 這就是我們的 API！
def get_posters_api(request):
    # 1. 去資料庫抓所有還沒交換出去的海報
    posters = Poster.objects.filter(is_exchanged=False).order_by('-created_at')

    # 2. 把資料轉換成跟你的 script.js 一樣的格式
    data = []
    for p in posters:
        data.append({
            'id': p.id,
            'user': p.owner.username, # 拿到上傳者的名字
            'posterName': p.movie_name,
            'offering': p.movie_name,
            # 如果有逗號就切開，沒有就當作單一項目，如果是空的就給空陣列
            'wantCategories': p.wanted_movie.replace('，', ',').split(',') if p.wanted_movie else [],
            # 這裡要小心，如果沒有圖片才不會報錯
            'image': p.image.url if p.image else ''
        })

    # 3. 回傳 JSON
    return JsonResponse({'posters': data})