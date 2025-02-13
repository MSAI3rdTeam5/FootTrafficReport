# 1) Meetecho 공식 Docker 이미지를 사용
FROM meetecho/janus-gateway:latest

# 2) Janus 설정 파일을 덮어쓸 경우(선택)
#    /usr/local/etc/janus/ 가 Janus의 기본 설정 디렉터리입니다.
COPY ./config /usr/local/etc/janus/

# 3) 필요 포트 EXPOSE
#    - 8088, 8089: Janus HTTP/HTTPS Admin/REST (기본)
#    - 8188, 8989: WebSockets (기본)
#    - 10000-10200/udp: RTP/RTCP (ICE candidate ports) 예시
EXPOSE 8088
EXPOSE 8089
EXPOSE 8188
EXPOSE 8989
EXPOSE 10000-10200/udp

# 4) 컨테이너가 실행될 때 janus를 바로 실행
#    (공식 이미지에서는 이미 ENTRYPOINT가 설정되어 있을 수도 있음)
#    만약 커스텀 entrypoint를 작성한다면 아래 CMD를 사용
# CMD ["janus", "-F", "/usr/local/etc/janus"]

