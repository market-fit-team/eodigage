# Teacher Review: round-02

## Hypothesis

round-01의 주요 실패였던 빈 content, DSML 노출, 무효 chart, 내부 타입명 노출, 저장 도구 조기 호출을 시스템 프롬프트와 실제 tool description override만으로 줄일 수 있다.

## Quantitative Snapshot

- total_trials: 9
- corrected mean_score: 0.821
- gpt-oss: mean_score=1.000, completed=3/3
- gemma: mean_score=0.593, completed=2/3
- deepseek: mean_score=0.870, completed=2/3

## Metric Correction

실행 직후 자동 생성 metrics는 timeout으로 누락된 턴을 점수에서 제외해 평균 0.878로 계산했다. 이는 deepseek attempt 1처럼 `trend_probe`만 성공하고 나머지 두 턴이 없는 trial을 과대평가한다. 결과 파일을 보정해 missing turn을 실패 placeholder로 추가했고, 보정 평균은 0.821이다. future writer도 같은 방식으로 고쳤다.

## Qualitative Review

gpt-oss는 round-02에서 가장 크게 개선됐다. 3회 모두 `web_search`를 호출했고, `commercial_report`에서 valid chart가 4~5개씩 생성됐다. 저장 제안도 "상권 분석 보고서", "검색 결과 정리", "간단 노트"처럼 사용자용 표현을 사용했고 내부 enum/tool명 누수는 보이지 않았다. 다만 응답의 수치와 출처가 여전히 신뢰하기 어렵다. 예를 들어 일부 답변은 지하철 노선이나 임대료 지수 설명이 어색하고, "서울시 열린데이터광장", "KB부동산"처럼 이름은 대지만 URL이 없다. round-03에서는 근거를 제목/URL 중심으로 더 강제해야 한다.

deepseek는 DSML 노출이 사라지고 chart JSON도 대부분 유효해졌다. attempt 2, 3의 보고서와 저장 제안은 사용자 관점에서 읽을 만했다. 하지만 `web_search`를 2~3회 호출하고도 "검색 기능이 원활하지 않다", "외부 검색 서비스가 연결되지 않았다"고 말하는 모순이 반복됐다. attempt 1은 첫 턴 이후 TimeoutError로 중단됐다. round-03에서는 검색 결과가 있으면 최소 2개 제목/URL을 인용하고, 검색 결과가 비었을 때만 "결과 부족"이라고 말하도록 더 좁혀야 한다.

gemma는 round-01의 완전 빈 응답보다는 나아졌지만 아직 핵심 실패다. trend 턴에서 "확인해 보겠다"는 visible text는 나오지만 실제 `web_search`를 호출하지 않는다. commercial_report 턴은 attempt 2, 3 모두 empty response다. 이후 artifact_policy 턴에서 뒤늦게 `web_search`를 호출하고 보고서까지 작성하는 흐름이 발생해 대화 순서가 깨졌다. 서버 로그에는 `MALFORMED_RESPONSE` 경고가 다시 나타났다. round-03에서는 시스템 프롬프트를 짧고 명령형으로 줄여 gemma 부담을 낮추고, "확인하겠다"는 말만 하고 끝내지 말라는 규칙을 앞쪽에 둔다.

## What Improved

- chart contract는 효과가 컸다. gpt-oss와 deepseek는 valid chart가 0개에서 대부분 통과로 개선됐다.
- 내부 타입명/도구명 노출은 크게 줄었다.
- 저장 도구 조기 호출도 round-02에서는 관측되지 않았다.
- midturn 성격의 짧은 진행 문장은 gemma/deepseek에서 더 자주 보였다.

## Remaining Failures

1. 실행 오류: deepseek attempt 1, gemma attempt 1이 TimeoutError로 중단됐다.
2. 필수 도구 미호출: gemma trend 턴은 3회 모두 `web_search`를 호출하지 않았다.
3. 도구 결과 사용 실패: deepseek는 검색 도구를 호출하고도 검색 불가라고 말했다.
4. 출처/근거 부족: 모든 모델이 URL 기반 출처를 충분히 남기지 못했다.
5. 응답 순서 실패: gemma는 보고서 요청 턴에서 비고, 저장 제안 턴에서 보고서를 작성했다.
6. 보고서 사실성: gpt-oss와 deepseek 모두 일부 수치가 출처 없는 추정처럼 보인다.

## Round-03 Hypothesis

round-03은 prompt를 더 짧고 운영 규칙 중심으로 바꾼다. 핵심 가설은 다음과 같다.

- 짧은 명령형 system prompt가 gemma의 MALFORMED/empty response를 줄인다.
- "확인해보겠다"라고 말하면 같은 턴에서 반드시 검색 도구를 호출하라는 규칙이 gemma의 미호출을 줄인다.
- `web_search` 이후에는 최소 2개 검색 결과 제목/URL을 근거로 쓰게 하면 gpt-oss/deepseek의 출처 품질이 올라간다.
- 검색 도구를 호출한 뒤 "검색 불가능"이라고 말하지 못하게 하면 deepseek의 모순이 줄어든다.
- chart 예시는 유지하되 더 짧게 제시해 gpt-oss/deepseek의 chart 성공은 보존한다.

Control conversation: market_report_control_v1
