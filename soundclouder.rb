require 'selenium-webdriver'

class FuckYouSoundCloudIllDoItMyself
  SOUNDCLOUD = 'http://www.soundcloud.com'
  WAIT = Selenium::WebDriver::Wait.new(:timeout => 30)

  def initialize
    # Go to SoundCloud
    driver.navigate.to SOUNDCLOUD

    # # Click 'Log In'
    # click find(css: 'button.loginButton')

    # # Focus driver on iframe
    # element = find(tag_name: 'iframe')
    # driver.switch_to.frame(element)

    # # Enter email
    # find(id: 'sign_in_up_email').send_keys 'jmklemen@gmail.com'
    # click find(id: 'sign_in_up_submit')

    # # Enter password
    # find(id: 'enter_password_field').send_keys 'SdJk96425177!!'
    # click find(id: 'enter_password_submit')

    # driver.switch_to.default_content
  end

  def search(term)
    ensure_logged_in!
    find(css: 'input.headerSearch__input').send_keys term.to_s
    find(css: 'button.headerSearch__submit').click
    sleep 10
  end

  private

  def find(element)
    WAIT.until { driver.find_element(element) }
  end

  def ensure_logged_in!
    WAIT.until { ! driver.find_element(css: 'button.loginButton') }
  end

  def click(element)
    WAIT.until { element.click }
  end

  def driver
    @driver ||= Selenium::WebDriver.for(:firefox)
  end
end

FuckYouSoundCloudIllDoItMyself.new.search('easy porter robinson')
# FuckYouSoundCloudIllDoItMyself.new.search('easy porter robinson')