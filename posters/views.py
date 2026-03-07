from django.shortcuts import render
from django.http import JsonResponse
from .models import Poster, UserProfile # 記得在上面引入 UserProfile

def index(request):
    return render(request, 'posters/index.html')

def get_posters_api(request):
    posters = Poster.objects.filter(is_exchanged=False).order_by('-created_at')

    data = []
    for p in posters:
        # 【防呆機制】：使用 get_or_create，如果舊帳號沒有 Profile，系統會自動幫他建一個預設 5.0 分的
        profile, created = UserProfile.objects.get_or_create(user=p.owner)

        data.append({
            'id': p.id,
            'user': p.owner.username,
            'rating': round(profile.rating, 1), # 新增：傳遞信用分數 (四捨五入到小數第一位)
            'tradeCount': profile.trade_count,  # 新增：傳遞交換次數
            'posterName': p.movie_name,
            'offering': p.movie_name,
            'wantCategories': p.wanted_movie.replace('，', ',').split(',') if p.wanted_movie else [],
            'image': p.image.url if p.image else ''
        })

    return JsonResponse({'posters': data})