import React, { useState } from "react"
import ReactDOM from "react-dom"
import { ToastContainer, toast, Slide } from "react-toastify"
import querystring from "querystring"
import Select, { StylesConfig } from "react-select"
import timezones from "timezones.json"

const selectStyle: StylesConfig = {
  control: (previous) => ({
    ...previous,
    height: 46,
    backgroundColor: "#f7fafc",
    borderColor: "#edf2f7",
  }),
}

const languages: {
  code: string
  local_name: string
}[] = require("../../languages.json")

let proceededUrl: string | null = null
let tweetId: string | null = null
let hash: string | null = null
let isNowEditing = false

const App: React.FC<{}> = () => {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const [blob, setBlob] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [imageFormat, setImageFormat] = useState("jpg")
  const [theme, setTheme] = useState("light")
  const [lang, setLang] = useState("en")
  const [timezone, setTimezone] = useState(0)
  const [scale, setScale] = useState(2)

  const getChangedSetting = () => {
    const settings: { [key: string]: string | number } = {}
    if (lang !== "en") settings["lang"] = lang
    if (timezone !== 0) settings["tz"] = timezone
    if (theme !== "light") settings["theme"] = theme
    if (scale !== 2) settings["scale"] = scale
    return settings
  }

  const getImageUrl = () => {
    const settings = getChangedSetting()
    if (!!Object.keys(settings).length) {
      return `${location.protocol}//${
        location.hostname
      }/${tweetId}.${imageFormat}?${querystring.stringify(settings)}`
    }
    return `${location.protocol}//${location.hostname}/${tweetId}.${imageFormat}`
  }

  const getScrapboxSnippet = () => {
    return `[${getImageUrl()} ${proceededUrl}]`
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleSubmitForm()
  }

  const onFocus = () => {
    isNowEditing = true
  }

  const onBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    e.persist()
    isNowEditing = false
    setTimeout(async () => {
      if (isNowEditing || e.target.disabled) return
      if (e.target.form.requestSubmit) {
        e.target.form.requestSubmit()
      } else {
        await handleSubmitForm()
      }
    }, 1000)
  }

  const handleSubmitForm = async () => {
    if (url.length === 0) return
    const m = url.match(/(twitter.com\/(.+)\/status\/)?(\d+)/)
    if (!m) {
      toast.error("The format of the URL is invalid.")
      return
    }

    tweetId = m[3]

    const stat = [tweetId, imageFormat, theme, lang, scale, timezone].join("")
    if (hash === stat) return
    hash = stat

    proceededUrl = `https://twitter.com/${m[2] || "twitter"}/status/${tweetId}`
    setLoading(true)

    try {
      let imageUrl = `/${tweetId}.${imageFormat}`
      const settings = getChangedSetting()
      if (!!Object.keys(settings).length) {
        imageUrl = `/${tweetId}.${imageFormat}?${querystring.stringify(
          settings
        )}`
      }
      const r = await fetch(imageUrl)

      if (!r.ok) {
        switch (r.status) {
          case 404:
            toast.error("No tweets found.")
            break
          default:
            toast.error(`An error has occurred: ${r.statusText}`)
            break
        }
        setLoading(false)
        return
      }

      const blob = await r.blob()
      const blobUrl = URL.createObjectURL(blob)
      setBlob(blobUrl)

      setLoading(false)
      setLoaded(true)
    } catch (error) {
      toast.error(`An error has occurred.`)
      setLoading(false)
      return
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col text-gray-800">
      <ToastContainer
        position={"top-left"}
        autoClose={2500}
        closeOnClick={true}
        transition={Slide}
      />
      <div className="flex-1">
        <div className="container mx-auto max-w-screen-md p-4">
          <div className="m-1 text-2xl">tweet-card</div>
          <hr />

          <div className="mx-1">
            <form onSubmit={onSubmit}>
              <div className="flex flex-wrap mt-2 -mx-3">
                <div className="w-full px-3 pb-2">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="tweet-url"
                  >
                    Tweet Url
                  </label>
                  <input
                    id="tweet-url"
                    className={`appearance-none block w-full border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      loading
                        ? "bg-gray-200 text-gray-400"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    type="text"
                    placeholder="https://twitter.com/jack/status/20 or 20"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={loading}
                    pattern=".*(\d+).*"
                  />
                  <div className="-mx-2 mb-2">
                    <div className="flex flex-row flex-wrap w-full mx-auto">
                      <div className="w-1/3 px-2">
                        <label
                          className="block text-gray-700 text-sm font-bold mb-2"
                          htmlFor="format"
                        >
                          Format
                        </label>
                        <div className="relative">
                          <Select
                            options={[
                              { value: "jpg", label: "JPG" },
                              { value: "png", label: "PNG" },
                            ]}
                            styles={selectStyle}
                            onChange={(value, action) => {
                              setImageFormat((value as { value: string }).value)
                            }}
                            id="format"
                            onBlur={onBlur}
                            onFocus={onFocus}
                            isDisabled={loading}
                            defaultValue={{ value: "jpg", label: "JPG" }}
                            filterOption={() => true}
                          />
                        </div>
                      </div>
                      <div className="w-1/3 px-2">
                        <label
                          className="block text-gray-700 text-sm font-bold mb-2"
                          htmlFor="theme"
                        >
                          Theme
                        </label>
                        <div className="relative">
                          <Select
                            options={[
                              { value: "light", label: "Light" },
                              { value: "dark", label: "Dark" },
                            ]}
                            styles={selectStyle}
                            onChange={(value, action) => {
                              setTheme((value as { value: string }).value)
                            }}
                            id="theme"
                            onBlur={onBlur}
                            onFocus={onFocus}
                            isDisabled={loading}
                            defaultValue={{ value: "light", label: "Light" }}
                            filterOption={() => true}
                          />
                        </div>
                      </div>
                      <div className="w-1/3 px-2">
                        <label
                          className="block text-gray-700 text-sm font-bold mb-2"
                          htmlFor="scale"
                        >
                          Scale
                        </label>
                        <div className="relative">
                          <input
                            id="scale"
                            className={`appearance-none block w-full border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                              loading
                                ? "bg-gray-200 text-gray-400"
                                : "bg-gray-100 text-gray-700"
                            }`}
                            type="number"
                            value={scale}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value)
                              if (Number.isNaN(p)) return
                              setScale(p)
                            }}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            disabled={loading}
                            min={1}
                            max={5}
                          />
                        </div>
                      </div>
                      <div className="w-1/2 px-2">
                        <label
                          className="block text-gray-700 text-sm font-bold mb-2"
                          htmlFor="lang"
                        >
                          Lang
                        </label>
                        <div className="relative">
                          <Select
                            options={languages.map((l) => ({
                              value: l.code,
                              label: `${l.local_name} (${l.code})`,
                            }))}
                            styles={selectStyle}
                            onChange={(value, action) => {
                              setLang((value as { value: string }).value)
                            }}
                            id="lang"
                            onBlur={onBlur}
                            onFocus={onFocus}
                            isDisabled={loading}
                            defaultValue={{
                              value: "en",
                              label: "English (en)",
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-1/2 px-2">
                        <label
                          className="block text-gray-700 text-sm font-bold mb-2"
                          htmlFor="timezone"
                        >
                          Timezone
                        </label>
                        <div className="relative">
                          <Select
                            options={timezones.map((t) => ({
                              value: t.offset,
                              label: t.text,
                            }))}
                            styles={selectStyle}
                            onChange={(value, action) => {
                              setTimezone((value as { value: number }).value)
                            }}
                            id="timezone"
                            onBlur={onBlur}
                            onFocus={onFocus}
                            isDisabled={loading}
                            defaultValue={{
                              value: 0,
                              label: "(UTC) Coordinated Universal Time",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {loaded ? (
              <a href={proceededUrl} target="_blank" rel="noopener">
                <div className="relative w-full text-center bg-gray-300 rounded-t">
                  <img className="w-full" src={blob} />
                  <div className="absolute loading-center">
                    <div className="h-full flex items-center justify-center">
                      <div
                        className={`loading ${
                          loading ? "opacity-100" : "opacity-0"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="h-full w-full flex-none bg-cover text-center bg-gray-300 rounded-t bg-center placeholder-cover">
                <div className="flex items-center justify-center">
                  <div
                    className={`loading ${
                      loading ? "opacity-100" : "opacity-0"
                    }`}
                  ></div>
                </div>
              </div>
            )}

            {loaded && (
              <div className="mt-2">
                <label className="block tracking-wide text-gray-600 text-sm mb-2">
                  Image Url
                </label>
                <div className="flex flex-wrap items-stretch w-full mb-4 relative">
                  <input
                    type="text"
                    className="flex-shrink flex-grow leading-normal w-px flex-1 h-10 rounded rounded-r-none px-3 relative bg-gray-200 text-gray-700 border border-gray-200"
                    value={getImageUrl()}
                    readOnly
                  />
                  <div className="flex -mr-px">
                    <button
                      className="flex items-center leading-normal bg-grey-lighter rounded rounded-l-none border border-l-0 border-grey-light px-3 whitespace-no-wrap text-grey-dark text-sm"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(getImageUrl())
                            toast.info("copied.")
                          }
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <label className="block tracking-wide text-gray-600 text-sm mb-2">
                  Scrapbox Snippet
                </label>
                <div className="flex flex-wrap items-stretch w-full mb-4 relative">
                  <input
                    type="text"
                    className="flex-shrink flex-grow leading-normal w-px flex-1 h-10 rounded rounded-r-none px-3 relative bg-gray-200 text-gray-700 border border-gray-200"
                    value={getScrapboxSnippet()}
                    readOnly
                  />
                  <div className="flex -mr-px">
                    <button
                      className="flex items-center leading-normal bg-grey-lighter rounded rounded-l-none border border-l-0 border-grey-light px-3 whitespace-no-wrap text-grey-dark text-sm"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(
                              getScrapboxSnippet()
                            )
                            toast.info("copied.")
                          }
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-screen-md mx-auto mx-2">
        <hr />
        <div className="flex justify-end text-xs p-4">
          <div className="text-right">
            <span>
              tweet-card&nbsp;/&nbsp;
              <a
                className="text-blue-400"
                target="_blank"
                href="https://github.com/ci7lus/tweet-card"
                rel="noopener"
              >
                code &amp; bug report
              </a>
              &nbsp;/&nbsp;
            </span>
            <span className="inline-block">
              Animation from&nbsp;
              <a
                className="text-blue-400"
                href="https://github.com/potato4d/preloaders"
                target="_blank"
                rel="noopener"
              >
                potato4d/preloaders
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("app"))
