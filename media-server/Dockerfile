# media-server/Dockerfile

# 1) canyan 공식 Docker 이미지를 사용
FROM canyan/janus-gateway:latest

# 2) Janus 설정 파일 복사
#    /usr/local/etc/janus/ 가 Janus의 기본 설정 디렉터리입니다.
COPY ./config /usr/local/etc/janus/

# 3) 필요 포트 EXPOSE
#    - 8188: Janus WebSockets (plain WS)
#    - 10000-10200/udp: RTP/RTCP (ICE candidate ports) 예시

EXPOSE 8188
EXPOSE 10000-10200/udp

# (선택) 8088, 8089, 8989를 사용하지 않는다면, 주석 처리:
# EXPOSE 8088
# EXPOSE 8089
# EXPOSE 8989

# 4) 컨테이너가 실행될 때 janus를 바로 실행
#    (공식 이미지에서는 이미 ENTRYPOINT ["janus", "-F", "/usr/local/etc/janus"] 설정)
#    만약 커스텀 entrypoint가 필요하다면 아래 CMD를 사용.
# CMD ["janus", "-F", "/usr/local/etc/janus"]
