# Teacher Review: round-03

## Hypothesis

현재 SearXNG env가 들어간 상태에서 web_search 스모크 호출은 성공한다. round-02의 chart/internal-name 개선은 유지하면서, 더 짧고 명령형인 계약으로 gemma의 empty/malformed 응답을 줄이고, gpt-oss/deepseek가 비어 있지 않은 검색 결과를 최종 답변의 근거/출처로 실제 반영하는지 확인한다.

## Quantitative Snapshot

- total_trials: 9
- mean_score: 0.716

## Model Observations

- gpt-oss: mean_score=0.778, completed=2/3
- gemma: mean_score=0.722, completed=2/3
- deepseek: mean_score=0.648, completed=2/3

## Qualitative Review

round-03은 평가 기준을 한 번 정정한 뒤 실행했다. 검색 결과가 `[]`이거나 메타서치 쪽 한계가 같이 내려오는 경우가 있으므로, `web_search` 호출 후 "검색이 원활하지 않다"는 문구 자체는 자동 실패로 보지 않도록 했다. 대신 실제 응답을 읽을 때는 검색 결과가 있었는지, 있었다면 제목/URL을 근거로 제대로 반영했는지를 정성 평가했다.

이번 차수의 가장 큰 관측은 환경 문제가 아니라 하네스/모델별 출력 안정성 문제다. 서버 로그상 SearXNG 호출은 여러 차례 HTTP 200으로 성공했고, gemma/gpt-oss/deepseek 모두 검색 호출 자체는 발생했다. 다만 세 모델 모두 각 1회씩 `TimeoutError`가 났다. LangGraph dev 서버 worker가 1개라 모델별 worker 3개가 큐를 공유했고, high reasoning + 다중 검색 조합에서 일부 trial이 턴 타임아웃에 걸린 것으로 보인다.

gpt-oss는 실제 품질 기준으로는 여전히 가장 안정적이다. attempt 1과 3은 `trend_probe`, `commercial_report`, `artifact_policy`를 모두 사용자용 문장으로 완결했고, 저장 제안도 "상권 분석 보고서", "검색 결과 정리", "간단 노트"처럼 내부 타입명 없이 설명했다. chart도 attempt 1은 1개, attempt 3은 3개가 valid로 잡혔다. 다만 검색 근거 품질은 아직 불안정하다. attempt 1은 네이버 블로그와 성수 가이드 URL을 실제로 붙이고, 해당 근거가 베이커리 매출/임대료 직접 근거는 아니라고 한계를 잘 적었다. 반면 attempt 3은 검색 결과가 YouTube 등 무관 결과였다고 말하면서도 임대료, 성장률, 유동인구 같은 수치를 꽤 많이 추정했다. gpt-oss에는 "무관 검색 결과면 숫자 차트를 줄이고, 현장조사 체크리스트 중심으로 전환"하는 지시가 더 필요하다.

gemma는 round-02보다 도구 호출 의지는 분명히 좋아졌다. attempt 1과 3의 첫 턴에서 `web_search`를 호출했고, attempt 2는 첫 턴에서 visible answer도 2,045자까지 생성했다. 하지만 핵심 실패는 여전하다. attempt 1과 3의 `trend_probe`는 검색을 호출했는데 사용자에게 보이는 최종 텍스트가 비어 있었고, attempt 1의 `commercial_report`도 비었다. attempt 3의 보고서는 읽을 만하지만 chart block이 없어 `min_valid_chart_blocks`를 실패했다. gemma에는 긴 시스템 프롬프트를 더 줄이는 것보다, provider normalization 또는 reasoning/content 추출 쪽을 먼저 의심해야 한다. "도구 호출 후 반드시 한 문단 이상의 final text" 같은 프롬프트만으로는 빈 visible response가 완전히 없어지지 않았다.

deepseek는 round-02에서 좋아졌던 DSML 분리 문제가 round-03에서 다시 크게 나빠졌다. attempt 1은 세 턴 모두 사용자 visible response가 `<｜｜DSML｜｜tool_calls>` 형태의 도구 호출 문자열로 시작했고, attempt 3도 첫 턴이 동일하게 DSML만 노출됐다. attempt 3의 보고서와 저장 제안은 읽을 만했지만, 첫 턴이 내부 호출문으로 새면 실사용에서는 치명적이다. deepseek는 프롬프트보다 provider/output parser 쪽에서 DSML tool-call 텍스트를 사용자 content로 흘리지 않도록 차단하는 하네스 조치가 먼저다.

응답 품질만 놓고 보면 round-03의 짧은 명령형 프롬프트는 gpt-oss에는 적합했고, gemma의 tool call 유도에는 일부 효과가 있었지만, deepseek의 내부 DSL 노출에는 역효과 또는 무효에 가깝다. 또한 세 모델 모두 timeout이 1회씩 발생해서, high reasoning 기준 전체 3모델 병렬 + 서버 worker 1개 조합은 평가 안정성 면에서 좋지 않다.

## Failure Priority Review

1. 실행 오류: 세 모델 모두 1회씩 `TimeoutError`가 발생했다. 결과 비교 신뢰도를 낮추는 최상위 실패다.
2. 필수 도구 미호출: 이전보다 개선됐다. completed trial 기준 대부분 첫 턴에서 `web_search`가 호출됐다.
3. 도구 실패: trial payload 기준 `tool_errors`는 두드러지지 않았다. 검색 HTTP도 서버 로그상 200이 반복됐다.
4. chart invalid/missing: gpt-oss는 개선 유지, gemma/deepseek는 보고서 차트 생성이 약하다.
5. 출처/근거 부족: gpt-oss는 제목/URL과 한계를 비교적 잘 쓰지만 무관 결과 처리와 추정 수치가 남는다. deepseek는 보고서 턴에서는 출처를 붙였지만 첫 턴은 DSML만 노출됐다.
6. 내부 타입명/DSL 노출: deepseek가 가장 큰 실패다. prompt-level 금지만으로 해결되지 않았다.
7. midturn: gpt-oss/gemma/deepseek 모두 도구 전 진행 텍스트나 호출 의지는 보이지만, "사용자에게 읽히는 중간 설명"의 품질은 모델별 편차가 크다.
8. 보고서 구조 품질: gpt-oss가 가장 좋고, gemma는 일반론 중심, deepseek는 정상 출력되는 턴에서는 준수하다.

## Next Round Notes

round-04를 한다면 프롬프트보다 하네스 레이어를 먼저 고쳐야 한다.

- deepseek: DSML/tool-call 문자열이 final text로 수집되지 않도록 SSE/content parser나 provider normalization에서 필터링한다.
- gemma: `reasoning_content`/thinking block에만 내용이 들어가고 visible content가 비는 케이스를 하네스에서 보정하거나, 빈 visible response를 감지해 같은 턴을 짧은 "최종 답변만 작성" 프롬프트로 재시도한다.
- scheduler: 동일 모델 순차는 유지하되, LangGraph dev server worker 1개에서 3모델 병렬을 돌리면 queue wait가 timeout을 유발한다. round-04는 모델 간 병렬을 끄거나 turn timeout을 늘려야 한다.
- evaluator: source signal은 URL 존재만 보지 말고, 검색 결과가 무관한 경우 "근거 부적합"을 따로 표시해야 한다.
- prompt: gpt-oss에는 "검색 결과가 무관하면 수치 차트 대신 확인 한계와 현장 조사 액션 중심으로 답하라"를 추가한다.

## Verdict

round-03은 검색 env 문제를 분리하는 데는 성공했다. 검색 도구는 살아 있고, 모델들이 실제로 검색을 호출한다. 하지만 "프롬프트만으로 세 모델을 동시에 안정화"한다는 가설은 약하다. gpt-oss는 production 후보로 계속 밀 수 있지만, gemma/deepseek는 하네스 정규화 없이는 사용자-facing 품질이 흔들린다.

Control conversation: market_report_control_v1
