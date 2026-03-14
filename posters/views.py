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

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import UserProfile

# 黑客松趕時間絕招：暫時豁免 CSRF 驗證，讓前端 fetch 更順利
@csrf_exempt 
def rate_user_api(request):
    if request.method == 'POST':
        try:
            # 解析前端傳來的資料
            data = json.loads(request.body)
            target_username = data.get('target_user')
            score = float(data.get('score', 5))

            # 找到被評價的使用者
            target_user = User.objects.get(username=target_username)
            profile, created = UserProfile.objects.get_or_create(user=target_user)

            # 計算新的平均分數
            if profile.trade_count == 0:
                # 如果是第一次交易，直接覆蓋預設的 5.0
                profile.rating = score
            else:
                # 如果有歷史紀錄，計算平均：(原本總分 + 這次分數) / 總次數
                total_score = profile.rating * profile.trade_count
                profile.rating = (total_score + score) / (profile.trade_count + 1)
            
            # 交易次數 +1
            profile.trade_count += 1
            profile.save()

            return JsonResponse({'status': 'success', 'new_rating': round(profile.rating, 1)})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)