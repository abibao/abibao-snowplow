def notifySlack(String buildStatus = 'STARTED') {
    // Build status of null means success.
    buildStatus = buildStatus ?: 'SUCCESS'

    def color

    if (buildStatus == 'STARTED') {
        color = '#d0d0d0'
    } else if (buildStatus == 'SUCCESS') {
        color = '#36a64f'
    } else if (buildStatus == 'UNSTABLE') {
        color = '#ff9933'
    } else {
        color = '#d10c20'
    }

    def msg = "${buildStatus}: `${env.JOB_NAME}` #${env.BUILD_NUMBER}:\n${env.BUILD_URL}"

    slackSend(color: color, message: msg)
}

node {

  try {
    notifySlack()

    stage("RethinkDB: individuals") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/aggregator/individuals \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F source=rethinkdb \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("Postgres: individuals") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/aggregator/individuals \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F source=postgres \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("Postgres: answers") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/aggregator/answers/postgres \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F source=postgres \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

  } catch (e) {
    currentBuild.result = 'FAILURE'
      throw e
  } finally {
    notifySlack(currentBuild.result)
  }

}
