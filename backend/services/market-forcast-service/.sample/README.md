# market-forcast-service/.sample

`.sample/*.csv`는 `../.raw/*.csv`에서 위쪽 행만 잘라 만든 학습 파이프라인 개발용 데이터다. 원본 `.raw/`는 git에 올리지 않는다.

```text
backend/services/market-forcast-service/
├── .raw/       # 원본 CSV, .gitignore 대상
└── .sample/    # 샘플 CSV, git 추적 대상
```

## CSV

모든 샘플 CSV는 UTF-8이다. 상권분석서비스 원본 중 CP949로 내려받힌 파일은 UTF-8로 변환했다.

대부분의 파일은 헤더 1행과 데이터 5행을 담는다. `small_business_activity_by_sector.sample.csv`는 원본이 2행 헤더라서 헤더 2행과 데이터 5행을 담는다.

| 파일 | 원본 데이터 | 행 | 모델링 메모 |
| --- | --- | ---: | --- |
| `estimated_sales_hdong_2025.sample.csv` | 서울시 상권분석서비스 추정매출-행정동 | 6 | `기준_년분기_코드`, `행정동_코드`, `서비스_업종_코드`별 `당월_매출_금액`, `당월_매출_건수` |
| `consumption_hdong.sample.csv` | 서울시 상권분석서비스 소비-행정동 | 6 | 행정동별 소비 지출 총액과 품목별 지출 |
| `resident_population_hdong.sample.csv` | 서울시 상권분석서비스 상주인구-행정동 | 6 | 행정동별 상주인구, 성별/연령대, 가구 수 |
| `working_population_hdong.sample.csv` | 서울시 상권분석서비스 직장인구-행정동 | 6 | 행정동별 직장인구, 성별/연령대 |
| `apartment_hdong.sample.csv` | 서울시 상권분석서비스 아파트-행정동 | 6 | 행정동별 아파트 단지, 면적/가격대, 평균 면적/시가 |
| `attraction_facilities_hdong.sample.csv` | 서울시 상권분석서비스 집객시설-행정동 | 6 | 행정동별 관공서, 병원, 학교, 지하철역, 버스정거장 수 |
| `living_population_hdong_domestic.sample.csv` | 행정동 단위 서울 생활인구 내국인 | 6 | `기준일ID`, `시간대구분`, `행정동코드`별 생활인구 |
| `subway_station_hourly_ridership.sample.csv` | 서울시 지하철 호선별 역별 시간대별 승하차 인원 | 6 | 역/호선/월별 시간대 승하차. 행정동 결합에는 역-행정동 매핑이 더 필요하다. |
| `small_business_activity_by_sector.sample.csv` | 서울시 영세자영업 경영활동 현황 업종별 | 7 | 업종별 운영점포수, 종사자수, 평균영업기간, 면적당매출액 |

## 중복 원본

`.raw/`에는 직장인구-행정동 CSV가 두 개 있다.

```text
서울시 상권분석서비스(직장인구-행정동).csv
서울시 상권분석서비스(직장인구-행정동) (1).csv
```

두 파일의 SHA-256이 같다. `.sample/working_population_hdong.sample.csv`는 하나만 만들었다.

## 참고 문서

- 서울시 상권분석서비스(추정매출-행정동): `https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do`
- 서울시 상권분석서비스(소비-행정동): `https://data.seoul.go.kr/dataList/OA-22166/S/1/datasetView.do`
- 서울시 상권분석서비스(상주인구-행정동): `https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do`
- 서울시 상권분석서비스(직장인구-행정동): `https://data.seoul.go.kr/dataList/OA-22184/S/1/datasetView.do`
- 서울시 상권분석서비스(아파트-행정동): `https://data.seoul.go.kr/dataList/OA-22163/S/1/datasetView.do`
- 서울시 상권분석서비스(집객시설-행정동): `https://data.seoul.go.kr/dataList/OA-22169/A/1/datasetView.do`
- 행정동 단위 서울 생활인구(내국인): `https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do`
- 서울시 지하철 호선별 역별 시간대별 승하차 인원 정보: `https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do`
- 서울시 영세자영업 경영활동 현황(업종별) 통계: `https://data.seoul.go.kr/dataList/OA-21398/S/1/datasetView.do`
