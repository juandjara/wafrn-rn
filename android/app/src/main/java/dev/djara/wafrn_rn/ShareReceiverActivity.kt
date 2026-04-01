package dev.djara.wafrn_rn

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class ShareReceiverActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val mainIntent = Intent(this, MainActivity::class.java).apply {
      action = intent.action
      setDataAndType(intent.data, intent.type)
      clipData = intent.clipData
      intent.extras?.let { putExtras(it) }
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    startActivity(mainIntent)
    finish()
  }
}
