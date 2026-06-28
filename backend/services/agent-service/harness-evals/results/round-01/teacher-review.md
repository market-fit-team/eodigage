# Teacher Review: round-01

## Hypothesis

현재 production 하네스의 baseline을 측정한다. 시스템 프롬프트는 `CHAT_SYSTEM_PROMPT` 그대로 두고, 실제 `system_context.py`가 렌더링하는 `<system_context>` 외에는 사용자 메시지 하단에 아무 것도 추가하지 않는다. 도구 설명도 production tool description을 그대로 사용한다.

## Quantitative Snapshot

- total_trials: 9
- mean_score: 0.756
- gpt-oss: mean_score=0.800, completed=3/3
- gemma: mean_score=0.600, completed=3/3
- deepseek: mean_score=0.867, completed=3/3

## Metric Caveat

round-01 자동 점수는 실제 품질보다 후하게 나왔다. 특히 gemma는 9개 턴 모두 최종 응답이 빈 문자열인데도 `run_completed`, `no_tool_errors`, 일부 금지어 체크가 통과해서 평균 0.600으로 계산됐다. deepseek도 사용자 답변 자리에 DSML 형태의 도구 호출 텍스트가 노출됐지만 기존 금지어 패턴이 이를 잡지 못했다. round-02부터는 `non_empty_response`와 확장된 내부 표식 검사를 추가한다.

## Qualitative Review

gpt-oss는 가장 안정적으로 길고 구조적인 보고서를 만들었다. `trend_probe`에서 3회 모두 `web_search`를 호출했고, `commercial_report`에서는 표와 보고서 섹션을 풍부하게 구성했다. 다만 검색 출처가 실제 결과 기반인지 불명확하고, “출처(예시)”처럼 근거가 약한 표현이 섞였다. 더 큰 문제는 차트다. 차트 fenced block은 여러 개 만들었지만 `pie`에 `xKey/series`를 쓰는 등 프론트 스키마와 하네스 validator가 요구하는 모양을 지키지 못해 valid chart가 0개였다. 저장 제안 턴에서는 `search_report`, `research_report`, `artifact_create`, `document_create` 같은 내부 타입명과 tool명을 그대로 노출했다.

gemma는 HTTP/API 관점에서는 completed로 끝났지만, 세 번의 시도 모두 사용자에게 보이는 `content`가 비어 있었다. 도구 호출도 전혀 없었다. 이 상태에서는 자동 점수와 관계없이 채팅 에이전트 품질은 실패다. round-02에서는 시스템 프롬프트에 “최종 사용자 답변은 반드시 일반 텍스트 content로 작성한다”는 지시를 넣어 모델의 visible answer 경로를 유도한다. 그래도 실패하면 provider normalization이나 모델별 content extraction 쪽을 봐야 한다.

deepseek는 자동 점수는 가장 높았지만 실제 응답 품질은 불안정했다. 일부 시도는 `web_search`를 호출하고 긴 한국어 답변을 만들었지만, `onboarding_get_default_profile`을 불필요하게 호출했고, 한 시도에서는 사용자 답변이 거의 `<｜｜DSML｜｜tool_calls>` 형태로만 나왔다. `commercial_report`에서 저장을 명시적으로 요청하지 않았는데 `artifact_create`를 먼저 호출한 케이스도 있었다. 도구 호출 의지는 높지만, 실제 사용자 답변과 내부 도구 표현을 분리하는 하네스 지시가 부족하다.

## Failure Priority Observation

1. 실행 오류: 서버와 API 호출은 9회 모두 completed로 끝났다.
2. 필수 도구 미호출: gemma는 필수 `web_search`를 한 번도 호출하지 못했다.
3. 도구 실패: raw tool error는 거의 없지만, deepseek가 도구를 호출하고도 “검색이 불가능하다”고 말하는 등 결과 사용 품질이 낮았다.
4. chart invalid: gpt-oss와 deepseek 모두 valid chart가 0개다.
5. 출처/근거 부족: gpt-oss는 검색 후에도 URL/제목 기반 근거가 약했고, deepseek는 검색 결과와 답변 연결이 흔들렸다.
6. 내부 타입명 노출: gpt-oss는 enum/tool명을 그대로 노출했고, deepseek는 DSML/tool DSL을 노출했다.
7. midturn 부족: gpt-oss는 첫 tool call 전 midturn이 없었고, deepseek는 있더라도 tool DSL과 섞였다.
8. 보고서 구조 품질: gpt-oss는 구조는 좋지만 근거와 수치 신뢰도가 약했고, deepseek는 완성도가 시도마다 크게 흔들렸다.

## Round-02 Hypothesis

다음 차수는 실제 production graph에서 허용한 `system_prompt`와 `tool_descriptions`만 바꾼다. 핵심 가설은 다음과 같다.

- 최종 답변을 반드시 일반 한국어 visible text로 작성하게 하면 gemma의 빈 응답과 deepseek의 DSML 노출이 줄어든다.
- 최신 트렌드는 먼저 `web_search`를 쓰고, 성공/실패 여부를 답변에서 구분하게 하면 “검색 불가능”식 모순이 줄어든다.
- 저장 도구는 사용자가 명시적으로 저장을 요청할 때만 호출하게 하면 `artifact_create` 조기 호출이 줄어든다.
- chart JSON 예시를 프론트 스키마와 동일하게 제시하면 valid chart가 증가한다.
- 내부 enum/tool명은 사용자용 표현으로 치환하게 하면 artifact policy 턴 품질이 올라간다.

Control conversation: market_report_control_v1
