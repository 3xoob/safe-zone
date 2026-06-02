pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  triggers {
    githubPush()
  }

  parameters {
    choice(name: 'DEPLOY_ENV', choices: ['local', 'staging', 'production'], description: 'Deployment target')
    string(name: 'GATEWAY_PORT', defaultValue: '18080', description: 'Gateway host port')
    string(name: 'FRONTEND_PORT', defaultValue: '4200', description: 'Frontend host port')
    booleanParam(name: 'RUN_BACKEND_TESTS', defaultValue: true, description: 'Run backend tests')
    booleanParam(name: 'RUN_FRONTEND_TESTS', defaultValue: true, description: 'Run frontend tests')
    string(name: 'SONAR_HOST_URL', defaultValue: 'http://localhost:9000', description: 'SonarQube server URL')
  }

  environment {
    COMPOSE_PROJECT_NAME = 'buy01'
    GATEWAY_PORT = "${params.GATEWAY_PORT}"
    FRONTEND_PORT = "${params.FRONTEND_PORT}"
    HEALTHCHECK_HOST = 'host.docker.internal'
    NOTIFY_EMAIL = 'ali.almoumnin@gmail.com'
    DEPLOY_TAG = 'local'
    SONAR_PROJECT_KEY = 'safe-zone-ecommerce'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.DEPLOY_TAG = env.GIT_COMMIT ?: env.BUILD_NUMBER
        }
      }
    }

    stage('Validate Tools') {
      steps {
        sh 'java -version'
        sh 'mvn -version'
        sh 'node -v'
        sh 'npm -v'
        sh 'docker --version'
        sh 'docker compose version'
        sh 'sonar-scanner --version'
      }
    }

    stage('Backend Tests') {
      when {
        expression { params.RUN_BACKEND_TESTS }
      }
      steps {
        dir('backend') {
          sh 'mvn clean verify'
        }
      }
      post {
        always {
          dir('backend') {
            junit testResults: '**/target/surefire-reports/*.xml'
          }
        }
      }
    }

    stage('Frontend Install') {
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
      }
    }

    stage('Frontend Tests') {
      when {
        expression { params.RUN_FRONTEND_TESTS }
      }
      steps {
        dir('frontend') {
          sh 'npm run test:coverage'
        }
      }
      post {
        always {
          junit testResults: 'frontend/test-results/**/*.xml'
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('safe-zone-sonarqube') {
          withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
            sh 'sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.token=${SONAR_TOKEN}'
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Docker Build') {
      steps {
        withCredentials([string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')]) {
          sh 'docker compose build'
        }
      }
    }

    stage('Backup Current Deployment') {
      steps {
        sh 'mkdir -p .deploy-backup'
        sh 'docker compose ps > .deploy-backup/previous-compose-state.txt || true'
        sh 'test ! -f .deploy-backup/last-successful-tag || cp .deploy-backup/last-successful-tag .deploy-backup/rollback-tag'
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')]) {
          sh 'docker compose up -d'
        }
      }
    }

    stage('Health Check') {
      steps {
        sh './scripts/health-check.sh'
      }
      post {
        success {
          sh 'mkdir -p .deploy-backup && printf "%s\\n" "${DEPLOY_TAG}" > .deploy-backup/last-successful-tag'
        }
      }
    }
  }

  post {
    success {
      echo "Buy-01 ${env.BUILD_NUMBER} deployed successfully to ${params.DEPLOY_ENV}."
      mail(
        subject: "Buy-01 SUCCESS: #${env.BUILD_NUMBER}",
        body: "Build succeeded and deployed to ${params.DEPLOY_ENV}.\n\nBuild URL: ${env.BUILD_URL}",
        to: "${env.NOTIFY_EMAIL}"
      )
    }
    unstable {
      mail(
        subject: "Buy-01 UNSTABLE: #${env.BUILD_NUMBER}",
        body: "Build is unstable. Check test reports and console output.\n\nBuild URL: ${env.BUILD_URL}",
        to: "${env.NOTIFY_EMAIL}"
      )
    }
    failure {
      echo 'Pipeline failed. Attempting rollback.'
      withCredentials([string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')]) {
        sh './scripts/rollback.sh || true'
      }
      mail(
        subject: "Buy-01 FAILED: #${env.BUILD_NUMBER}",
        body: "Build failed. Rollback was attempted.\n\nBuild URL: ${env.BUILD_URL}",
        to: "${env.NOTIFY_EMAIL}"
      )
    }
    always {
      echo "Build result: ${currentBuild.currentResult}"
    }
  }
}
