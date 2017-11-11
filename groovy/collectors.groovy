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

    stage("Postgres: individuals") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/postgres \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=individuals \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("Postgres: answers") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/postgres \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=answers \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("Postgres: campaigns") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/postgres \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=campaigns \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("RethinkDB: individuals") {

      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/rethinkdb \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=individuals \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("RethinkDB: surveys") {
      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/rethinkdb \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=surveys \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("RethinkDB: campaigns") {
      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/rethinkdb \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=campaigns \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("RethinkDB: items") {
      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/rethinkdb \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=campaigns_items \
          -F callback=${hook.getURL()}"
      data = waitForWebhook hook
    }

    stage("RethinkDB: choices") {
      hook = registerWebhook()
      sh  "curl -X POST \
          http://172.90.0.3:4040/api/collector/rethinkdb \
          -H 'cache-control: no-cache' \
          -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
          -F table=campaigns_items_choices \
          -F callback=${hook.getURL()}"
    }

  } catch (e) {
    currentBuild.result = 'FAILURE'
      throw e
  } finally {
    notifySlack(currentBuild.result)
  }

}
