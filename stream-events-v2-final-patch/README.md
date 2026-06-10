# Stream Events Protocol V2 Final Patch

이 패치는 legacy `/runs/stream` 기반 `tools` stream mode 시도를 제거하고, 공식 `@langchain/react` + Protocol V2 `/stream/events` + `/commands` 경로로 전환합니다.

적용:

```bash
./stream-events-v2-final-patch/APPLY_STREAM_EVENTS_V2_FINAL_PATCH.sh "$(pwd)"
```

삭제 대상은 `DELETE_FILES.txt`, 포함 파일은 `PATCH_FILE_LIST.txt`를 확인하세요.
인수/검증 문서는 `docs/STREAM_EVENTS_V2_PROTOCOL_V2_HANDOFF.md`에 포함되어 있습니다.
