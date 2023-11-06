FROM golang:1.20.5-alpine

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/zilla-backend

EXPOSE 3000

CMD ["/app/zilla-backend"]

