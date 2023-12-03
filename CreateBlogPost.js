import '../../styles/blogs.css'
import { useState, useEffect, useRef } from 'react';
import { getIsDesktop, Pages, getUrlParameter, debounce} from '../../utils/Utils';
import { useHistory } from "react-router-dom";
import { getDesktopStyle } from '../../utils/Styles';
import other_back from '../../img/other/other_back.svg'
import back_arrow from '../../img/experts/back_arrow.svg'
import refresh from '../../img/blogs/refresh.svg'
import help_circle from '../../img/profile/help_circle.svg'
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import ImageCompress from 'quill-image-compress'
import { BlogsApi } from '../../api/BlogsApi';
import BlogThemePickerDialog from './dialogs/BlogThemePickerDialog';
import Loader from '../../custom_views/Loader';
import { getQuillTooltip } from './utils/BlogUtils';
import GigachatTooltip from './tooltips/GigachatTooltip';
import close from '../../img/blogs/close.svg'

const moduleName = "modules/imageCompress";
var previousH1Text = ""
var isTabbedText = false
var gigachatText = ""
var isTextInsertingFromTooltip = false
function CreateBlogPost(props) {
    const [isEdit, setEdit] = useState(false)
    const [blogThemes, setBlogThemes] = useState((props.user != undefined && props.user.specializations != undefined) ? props.user.specializations : [])
    const [savedPost, setSavedPost] = useState(undefined)
    const [isShowThemesPicker, setShowThemesPicker] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [isGigachatLoadingState, setGigachatLoadingState] = useState(false)
    const [kandinskyImg, setKandinskyImg] = useState("")
    const [isKandinskyLoading, setKandinskyLoading] = useState(false)
    const [isShowGigachatTooltip, setShowGigachatTooltip] = useState(false)
    var isGigachatLoading = false
    
  
    const onTabKeyDown = (e) => {
        // if (e.key === "tab") {
        //     console.log("onKeyDown tab")
        //     e.preventDefault()
            document.getElementById("blogs_tab_cont").setAttribute("style", "display : none")
            const quillEditor = document.getElementsByClassName("ql-editor")[0]
            var pTags = quillEditor.getElementsByTagName('p')
            Array.from(pTags).forEach(pTag => {
                pTag.className = "blogs_quill_text blogs_quill_text_tabbed"
            })
            if (gigachatText != "" && !isTabbedText){
                gigachatText = ""
                isTabbedText = true
                isTextInsertingFromTooltip = true
                setTimeout(function() {
                    isTextInsertingFromTooltip = false
                }, 1000)
            }
        // }
    }
    var bindings = {
        tab: {
          key: 9,
          handler: onTabKeyDown    
        }
    }
    const uploadMedia = (imageBlob, onSuccess) => {
        fetch("https://sozvon.pro/api/uploadMedia", {
                    method: "POST",
                    body: imageBlob,
                    headers: {
                        access_token: "5UDItb1CyYQoxMWs5ml71677790397579",
                    },
                })
                    .then((response) => response.json())
                    .then((result) => {
                        onSuccess(result)
                    })
                    .catch((error) => {
                        console.error(error);
                    });
    }
    const { quill, quillRef, Quill } = useQuill({ 
        modules: {
            keyboard: {
                bindings: bindings
              },
        ...{ imageCompress: {
            quality: 1.0,
            maxWidth: 800, // default
            maxHeight: 800, // default
            imageType: "image/jpeg",
            insertIntoEditor: (imageBase64URL, imageBlob, editor) => {
                uploadMedia(imageBlob, (result) => {
                    const range = editor.getSelection();
                    editor.insertEmbed(range.index, "image", `${result.url}`, "user");
                })
            },
        },
        toolbar: getQuillTooltip(),
        }
    }})
    
    if (Quill && !quill) { // For execute this line only once.
        Quill.register(moduleName, ImageCompress, true);
       
    }
    useEffect(() => {
        
        if (quill) {
            quill.on('text-change', onQuilltextChanged)
            // document.getElementsByClassName("ql-editor")[0].addEventListener("keydown", onKeyDown)
            if (isDesktop){
                const quillEditor = document.getElementsByClassName("ql-editor")[0]
                quillEditor.setAttribute("style", 'padding : 16px 32px;')
                var toolbars = quillEditor.getElementsByClassName("toolbar")
                var qlContainers = document.getElementsByClassName("ql-container")
                if (toolbars.length > 0){
                    toolbars[0].setAttribute("style", 'border-radius : 16px 16px 0 0;')
                }
                if (qlContainers.length > 0){
                    qlContainers[0].setAttribute("style", 'border-radius :  0 0 16px 16px;')
                }
            }
        }
      }, [quill])
    
    const history = useHistory()
    const user = props.user
    const isDesktop = getIsDesktop()
    
    useEffect(() => {
        setTimeout(function() {
            const videoTags = window.document.getElementsByClassName("ql-video")
            if (videoTags.length > 0){
                videoTags[0].addEventListener('click', function(e){
                    window.document.getElementsByClassName("ql-editing")[0].getElementsByTagName("input")[0].setAttribute("placeholder","Ссылка на видео с ютюба")
                })
            }
        }, 1000)
        const is_edit = getUrlParameter("is_edit")
        setEdit(is_edit != null && is_edit != undefined && is_edit != "")
        if (is_edit){
            getSavedPost(getUrlParameter("id"))
        }
        
    }, [])
    
    useEffect(() => {
     if (quill && savedPost) {
            quill.clipboard.dangerouslyPasteHTML(savedPost.text);
        }
    }, [quill, savedPost])
    useEffect(() => {
        if (user != undefined && user.specializations != undefined){
            if (!isEdit){
                setBlogThemes(user.specializations)
            }
        } else {setBlogThemes([])}
    }, [user])
    const onQuilltextChanged = (delta, oldDelta, source) => {
        var h1 = quill.root.getElementsByTagName("h1")
        const quillEditor = document.getElementsByClassName("ql-editor")[0]

        const tabbedElements = quillEditor.getElementsByClassName("blogs_quill_text_tabbed")
        console.log("tabbedElements = ", tabbedElements)
        var textClass = "blogs_quill_text"
        var isEmptyTabbed = false
        if (tabbedElements.length > 0){
            isEmptyTabbed = tabbedElements[0].innerText == "<br/>" || tabbedElements[0].innerText.trim() == ""
            console.log("tabbedElements changed = ", tabbedElements[0].innerText)
        }
        if (tabbedElements.length == 0 || isEmptyTabbed){
            setServicesValueDebounced.current(quill, h1)
        } else {
            textClass = "blogs_quill_text blogs_quill_text_tabbed"
        }
        var pTags = quillEditor.getElementsByTagName('p')
        
        Array.from(pTags).forEach(pTag => {
            pTag.className = textClass
            const selectors = pTag.querySelectorAll('span')
                Array.from(selectors).forEach(span => {
                    span.setAttribute("style", 'background-color: white;')
                })

        })
        var insertedTextClasses = quillEditor.getElementsByClassName("blogs_not_tabbed_text")
        if (gigachatText != "" && !isTabbedText && insertedTextClasses.length == 0 && h1 && h1.length > 0){
            if (pTags.length > 0 && pTags[0].innerText != "" && pTags[0].innerHTML != "<br/>"){
                pTags[0].className = "blogs_not_tabbed_text"
            }
        }
 
        if (insertedTextClasses.length > 0){
            console.log("make tab visible = ", insertedTextClasses)
            var rect = insertedTextClasses[0].getBoundingClientRect()
            document.getElementById("blogs_tab_cont").setAttribute("style", "display : block; top : " + (rect.top - 147) + "px;")
        }
        if (pTags.length > 0 && !isTextInsertingFromTooltip){
            setDebounceTextHelper.current(quill, pTags[pTags.length - 1])
        } else {
            hideGigachatTooltip()
        }
        
    }
    const setDebounceTextHelper = useRef(debounce((quill, p) => {
        console.log("setDebounceTextHelper p = ", p.innerText)
        if (p != undefined && p.innerText && p.innerText.trim() != "" && p.innerText.trim() != "<br/>" && !p.className.includes("blogs_not_tabbed_text")){
            BlogsApi.getGigaChatAnswer({
                "system_message": "закончи предложение " + p.innerText,
                "human_message":  "закончи предложение " + p.innerText
            }, (responseData) => {
                var rect = p.getBoundingClientRect()
                document.getElementsByClassName("gigachat_tooltip_pos")[0].setAttribute("style", "display : block;top : " + (rect.top - 140) + "px;")
                document.getElementsByClassName("gigachat_tooltip_text")[0].innerText = responseData.text.content
            })
        } else {
            hideGigachatTooltip()
        }
        
    }, 1000))
    const hideGigachatTooltip = () => {
        document.getElementsByClassName("gigachat_tooltip_pos")[0].setAttribute("style", "display : none")
    }

    const addTextFromTooltip = () => {
        hideGigachatTooltip()
        const text = document.getElementsByClassName("gigachat_tooltip_text")[0].innerText
        isTextInsertingFromTooltip = true
        var pTags = document.getElementsByClassName("ql-editor")[0].getElementsByTagName('p')
        if (pTags.length > 0){
           const searchText = pTags[pTags.length - 1].innerText.trim().toLowerCase()
           if (text.trim().toLowerCase().startsWith(searchText) || text.trim().toLowerCase().startsWith("\"" + searchText)){
                console.log("addTextFromTooltip startsWith = ", searchText)
                console.log("addTextFromTooltip startsWith = ", text)
                pTags[pTags.length - 1].innerText = ""
                quill.insertText(999999, text)
           } else {
                console.log("addTextFromTooltip !startsWith = ", searchText)
                console.log("addTextFromTooltip !startsWith = ", text)
                quill.insertText(999999, text)
           }
            // quill.insertText(999999, text)
        } 
        
        setTimeout(function() {
            isTextInsertingFromTooltip = false
        }, 1000)

    }
    const setServicesValueDebounced = useRef(debounce((quill, h1) => {
        
        if (h1 && h1.length > 0 && h1[0].innerText != "" && h1[0].innerText.trim() != "<br/>" && h1[0].innerText.trim() != "" && !isGigachatLoading && previousH1Text.trim() != h1[0].innerText.trim()){
            setGigachatLoadingState(true)
            const searchText = h1[0].innerHTML
            console.log("setServicesValueDebounced searchText = ", searchText)
            isGigachatLoading = true
            hideGigachatTooltip()
            BlogsApi.getGigaChatAnswer({
                "system_message": "напиши статью про " + searchText,
                "human_message": "напиши статью про " + searchText
            }, (responseData) => {
                setGigachatLoadingState(false)
                if (!quill.root.innerHTML.includes(responseData.text.content)){
                    gigachatText = responseData.text.content
                    isGigachatLoading = false
                    isTabbedText = false
                    const newText = "<h1>" + searchText + "</h1>" + "<p name='insterted_text'>" + responseData.text.content + "</p>"
                    quill.clipboard.dangerouslyPasteHTML(newText)
                    quill.setSelection(searchText.length, 0)
         
                    console.log("newText = ", newText)
                    previousH1Text = searchText
                    
                }
            }, () => {
                isGigachatLoading = false
                setGigachatLoadingState(false)
            })
            if (searchText != ""){
                loadKandinskyImg(searchText)
            }
        }
    }, 700))
    const insertKandinskyImg = async () => {
        const base64Data = kandinskyImg;
        const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
        const blob = await base64Response.blob()
        uploadMedia(blob, (result) => {
            quill.insertEmbed(100000, "image", `${result.url}`, "user");
            onTabKeyDown()
        })
        
    }
    const refreshImg = () => {
        const h1 = quill.root.getElementsByTagName("h1")
        if (h1.length > 0){
            loadKandinskyImg(h1[0].innerText)
        }
    }
    const loadKandinskyImg = (searchText) => {
        console.log("loadKandinskyImg ")
        setKandinskyLoading(true)
        setKandinskyImg("")
        BlogsApi.genGigaImage({query : searchText}, (responseData) => {
            if (responseData.image){
                setKandinskyImg(responseData.image)
            }
            setKandinskyLoading(false)
        }, () => {
            setKandinskyLoading(false)
        })
    }
    const getSavedPost = (id) => {
        BlogsApi.getPostByID(id, (responseData) => {
            const item = responseData.item
            if (item){
                setSavedPost(item)
                setBlogThemes(item.categories)
            }
        }, () => {})
    }
    const createBlog = () => {
        var textToolInputEditor = window.document.getElementsByClassName("ql-editor")[0].outerHTML.replace("id=\"main_input\"","");
        textToolInputEditor = textToolInputEditor.replace("contenteditable=\"true\"","contenteditable=\"false\" style=\"white-space: unset;padding: 0px;\"")
        const params = {
            "text": textToolInputEditor,
            "category": blogThemes.join(",")
        }
        
        setLoading(true)
        if (isEdit){
            editBlogRequest(params)
        } else {
            createBlogRequest(params)
        }
        
    }
    const editBlogRequest = (params) => {
        if (savedPost != undefined){
            BlogsApi.editPost(savedPost._id, params.text, (responseData) => {
                setLoading(false)
                window.location.href = Pages.blogs
            }, () => { setLoading(false) })
        }
    }
    const createBlogRequest = (params) => {
        BlogsApi.createPost(params, (responseData) => {
            setLoading(false)
            window.location.href = Pages.blogs
        }, () => { setLoading(false) })
    }
    const onEnterPressed = (e) => {
        if (e.key === 'Tab') {

        } else {
            if (e.key === 'Enter') {
                if (gigachatText != "" && !isTabbedText){
                    gigachatText = ""
                    quill.clipboard.dangerouslyPasteHTML("<h1>" + previousH1Text + "</h1><br/><p></p>")
                    quill.setSelection(previousH1Text.length, 0)
                    document.getElementById("blogs_tab_cont").setAttribute("style", "display : none")               
                }
            } else {
                onTabKeyDown()
            }
        }
       
    }
    const getToolbar = () => {
        return(
            <div className="picked_ads_top_header">
                <div className="flex">
                    {isDesktop ? <img onClick={() => history.goBack()} className="ads_back_desktop blog_post_back hover" src={other_back}/> 
                    :
                    <img onClick={() => history.goBack()} className="back_arrow_theme hover" src={back_arrow}/>}
                    <div className="blog_toolbar_title">Написать пост</div>
                </div>
            </div>
        )
    }
    return (
        <div onKeyDown={onEnterPressed} style={isDesktop ? getDesktopStyle() : {zIndex : 2}} className="selected_settings blog_create_bg">
            <div className={isDesktop ? "blogs_create_desktop" : "selected_settings blog_create_bg"}>
                {getToolbar()}
                <div className="blog_quill_bg relative">
                    <div className="blog_quill">
                        <div ref={quillRef} />
                        {isGigachatLoadingState && <Loader />}

                    </div>
                    {(isKandinskyLoading || kandinskyImg != "") && <div className="blogs_kandisky_cont">
                        <div className="blogs_kandisky_title">Предлагаем<br/>картинку к посту</div>
                        <div className="blogs_kandisky_img_cont">
                            {kandinskyImg != "" && <img src={"data:image/png;base64, " + kandinskyImg}/>}
                            {isKandinskyLoading && <Loader style={{marginTop : 0, height : '32px', minHeight : '32px'}}/>}
                        </div>
                        {kandinskyImg != "" &&  <div>
                            <div className="blogs_kandisky_refresh hover">
                                <img onClick={refreshImg} src={refresh}/>
                            </div>
                            <div onClick={insertKandinskyImg} className="blogs_enter_kandinsky hover">Вставить в пост</div>
                        </div>}
                    </div>}
                    <div className="blogs_just_cont">
                        <div onClick={() => setShowThemesPicker(true)} className="flex hover">
                            <div className="blog_theme_title">Тема поста</div>
                            <div className="blog_theme">{blogThemes.join(", ")}</div>
                        </div>
                        <img onClick={() => setShowGigachatTooltip(!isShowGigachatTooltip)} className="help_circle_profile hover" src={help_circle}/>
                        {/* <div style={{paddingTop : 0, marginTop : '-4px'}} onClick={() => setShowGigachatTooltip(true)} className="help_circle_profile_cont hover">
                            
                        </div> */}
                        {isShowGigachatTooltip && <GigachatTooltip setShow={setShowGigachatTooltip}/>}
                    </div>

                    
                    <div onClick={onTabKeyDown} id="blogs_tab_cont" className="blogs_tab_cont hover">tab</div>
                    <div className="blogs_gigachat_tooltip_pos gigachat_tooltip_pos">
                        <p onClick={addTextFromTooltip} className="blogs_gigachat_tooltip gigachat_tooltip_text"></p>
                        <img onClick={() => document.getElementsByClassName("gigachat_tooltip_pos")[0].setAttribute("style", "display : none")} className="hover" src={close}/>
                    </div>
                </div>
                <div onClick={createBlog} className="create_ads_btn blog_create_btn hover">{isLoading ? <Loader/> : <div>Опубликовать</div>}</div>
            </div>
            <BlogThemePickerDialog blogThemes={blogThemes} specializations={props.specializations} setBlogThemes={setBlogThemes} isShow={isShowThemesPicker} setShow={setShowThemesPicker}/>

            
        </div>
    );
}

export default CreateBlogPost;

