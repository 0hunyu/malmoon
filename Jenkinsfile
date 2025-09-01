pipeline {
    agent any

    environment {
        IMAGE_NAME = 'my-frontend-image'
        CONTAINER_NAME = 'frontend-container'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                echo '🧼 이전 작업공간 정리 중...'
                cleanWs()
            }
        }

        // 이 블록은 제거하거나 주석 처리 권장
        // stage('Git Checkout') {
        //     steps {
        //         echo '📥 Git 저장소 다시 clone 중...'
        //         // checkout scm
        //     }
        // }

        stage('Spring Boot Build') {
            steps {
                echo '🔨 Spring Boot 애플리케이션 빌드 중...'
                sh '''
                    cd apps/backend
                    chmod +x ./gradlew
                    ./gradlew build
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo '🐳 Docker 이미지 빌드 중...'
                sh "docker build -t $IMAGE_NAME ."
            }
        }

        stage('Stop Old Container') {
            steps {
                echo '🧹 기존 컨테이너 중지 중...'
                sh "docker stop $CONTAINER_NAME || true"
                sh "docker rm $CONTAINER_NAME || true"
            }
        }

        stage('Run New Container') {
            steps {
                echo '🚀 새 컨테이너 실행 중...'
                sh "docker run -d --name $CONTAINER_NAME -p 8080:8080 $IMAGE_NAME"
            }
        }
    }
}
