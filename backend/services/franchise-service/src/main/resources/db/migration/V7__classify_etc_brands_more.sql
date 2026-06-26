-- V6 1차 분류 후에도 미분류로 남은 '기타/거친분류' 브랜드를 2차 키워드 규칙으로 추가 분류한다.
-- 아직 brand override가 NULL인 것만 대상으로 한다(이미 분류된 것은 건드리지 않음).
CREATE TEMP TABLE _rules2(priority int, mlsfc_names text[], pat text, cd text, nm text) ON COMMIT DROP;
INSERT INTO _rules2 VALUES
-- ===== 기타 외식 2차 =====
(10, ARRAY['기타 외식'], '닭|강정|꼬꼬', 'CS100007','치킨전문점'),
(10, ARRAY['기타 외식'], '오니기리|유부|복어|문어|규카츠|타코야끼', 'CS100003','일식음식점'),
(10, ARRAY['기타 외식'], '보울|bowl|커리|카레|사라다|샌드위치|피쉬|쌀국수|샐러드', 'CS100004','양식음식점'),
(10, ARRAY['기타 외식'], '다방|크리머리|밀크티|버블티|라떼|밀크랜드', 'CS100010','커피-음료'),
(10, ARRAY['기타 외식'], '꽈배기|호두과자|약과|모찌|마카롱', 'CS100005','제과점'),
(20, ARRAY['기타 외식'], '추어탕|동태|매운탕|우럭|솥밥|누룽지|미역|양푼|돼지|두껍삼|꼬치|탕|곳간|찜|볶|전집|국밥|국수|면|숯불|구이|회|쌈|반상|한상|정식', 'CS100001','한식음식점'),
-- ===== 기타 도소매 2차 =====
(10, ARRAY['기타 도소매', '기타도소매'], '폰|텔레콤|telecom', 'CS300004','핸드폰'),
(10, ARRAY['기타 도소매', '기타도소매'], '보청기', 'CS300019','의료기기'),
(10, ARRAY['기타 도소매', '기타도소매'], '반지|미니골드|피어싱|주얼리|쥬얼리', 'CS300017','시계및귀금속'),
(10, ARRAY['기타 도소매', '기타도소매'], '비전|광학|아이웨어', 'CS300016','안경'),
(10, ARRAY['기타 도소매', '기타도소매'], '신발|슈즈|shoe|운동화', 'CS300014','신발'),
(10, ARRAY['기타 도소매', '기타도소매'], '페인트|인테리어|타일|벽지', 'CS300035','인테리어'),
(10, ARRAY['기타 도소매', '기타도소매'], '밀키트|밀킷|반찬|집밥|한끼', 'CS300010','반찬가게'),
(15, ARRAY['기타 도소매', '기타도소매'], '캔들|향초|디퓨저', 'CS300022','화장품'),
-- ===== 기타 서비스 2차 =====
(10, ARRAY['기타 서비스'], '인생네컷|네컷|무인사진|셀프사진|포토', 'CS200041','사진관'),
(10, ARRAY['기타 서비스'], '코인빨래방|빨래방|코인세탁', 'CS200031','세탁소'),
(10, ARRAY['기타 서비스'], '키즈카페|놀이방|키즈', 'CS200005','스포츠 강습'),
-- ===== 기타 교육 2차 =====
(20, ARRAY['기타 교육'], '키즈|놀이|유아|어린이|영재|두뇌|사고력|한자|서예|바둑|웅변|글쓰기|독해|연산', 'CS200001','일반교습학원');

UPDATE franchise_brands b
SET market_svc_induty_cd = m.cd, market_svc_induty_cd_nm = m.nm
FROM (
    SELECT DISTINCT ON (b2.id) b2.id, r.cd, r.nm
    FROM franchise_brands b2
    JOIN franchise_industries i ON i.id = b2.primary_industry_id AND i.market_svc_induty_cd IS NULL
    JOIN _rules2 r ON (i.induty_mlsfc_nm = ANY(r.mlsfc_names)) AND (b2.brand_name ~* r.pat OR b2.company_name ~* r.pat)
    WHERE b2.market_svc_induty_cd IS NULL
    ORDER BY b2.id, r.priority
) m
WHERE b.id = m.id;
