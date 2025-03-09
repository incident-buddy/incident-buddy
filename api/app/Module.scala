import com.google.inject.{AbstractModule, Provides}
import com.typesafe.config.{Config => PlayConfig}

import config.Conf


class Module extends AbstractModule {
  override def configure(): Unit = {
    // bind(classOf[HomeController]).asEagerSingleton()
  }

  @Provides
  def provideConf(playConf: PlayConfig): Conf = {
    val jdbcUrl = s"jdbc:postgresql://${playConf.getString("db.host")}:${playConf
      .getInt("db.port")}/${playConf.getString("db.name")}"
    val db = Conf.DB(
      jdbcUrl = jdbcUrl,
      user = playConf.getString("db.user"),
      password = playConf.getString("db.pass")
    )
    Conf(db = db)
  }
}

package object config {
  final case class Conf(db: Conf.DB)
  object Conf {
    final case class DB(jdbcUrl: String, user: String, password: String)
  }
}
