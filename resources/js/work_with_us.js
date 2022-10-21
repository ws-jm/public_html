let form=document.querySelector("form");
let text=document.getElementById("message");
let textarea_error=document.querySelector(".textarea-error");
let name=document.querySelector("#name");
let name_error=document.querySelector(".name-error");
let CompanyName_error=document.querySelector(".CompanyName-error");
let CompanyName=document.querySelector("#CompanyName");

let succes_form=document.querySelector("#form-success");
let form_checkbox=document.querySelector("#check");
let check_error=document.querySelector(".check-error");
let select_error=document.querySelector(".select-error");

let errors_text=document.querySelectorAll(".error-text")

for(let i=0;i<errors_text.length;i++){
    errors_text[i].style.display="none"
}

form.addEventListener("submit",(e)=>{
    e.preventDefault();
    let interestesOption_value=document.querySelector("#interestedOption").value;
    if(name.value.length<3 || CompanyName.value.length<3 || text.value.length<10 || !form_checkbox.checked || interestesOption_value==="Interested Option"){

         if(name.value.length<3){
             name_error.style.display="Block";
         }
         else{
                 name_error.style.display="none";
         }


         if(CompanyName.value.length<3){
                 CompanyName_error.style.display="block";
         }
         else{
                 CompanyName_error.style.display="none";
         }

         if(text.value.length<10){
                 textarea_error.style.display="Block";
         }
         else{
                 textarea_error.style.display="none";
         }

         if(!form_checkbox.checked){
             check_error.style.display="block";
         }
         else{
             check_error.style.display="none";
         }

         if(interestesOption_value==="Interested Option"){
            select_error.style.display="block";
         }
         else{
            select_error.style.display="none";
        }

     }

     else{
        let name_Value=document.querySelector("#name").value;
        let CompanyName_Value=document.querySelector("#CompanyName").value;
        let email=document.querySelector("#email").value;
        let Message=document.getElementById("message").value;
        let interestesOption_value=document.querySelector("#interestedOption").value;
        

        


            var data = { 
                m_name: name_Value,
                m_companyName: CompanyName_Value,
                m_email: email,
                m_InterestedOption:interestesOption_value,
                m_comment: Message
                    };
                    
                var message = "Name\r\n-------------------------\r\n"
                            + data['m_name']
                            + "\r\n\r\nCompany\r\n-------------------------\r\n"
                            + data['m_companyName']
                            + "\r\n\r\nEmail\r\n-------------------------\r\n"
                            + data['m_email']
                            + "\r\n\r\nInterested-Option\r\n-------------------------\r\n"
                            + data['m_InterestedOption']
                            + "\r\n\r\nMessage\r\n-------------------------\r\n"
                            + data['m_comment'];
                    alert(`${message}`)
                    form.reset();
                    let errors_text=document.querySelectorAll(".error-text")

                    for(let i=0;i<errors_text.length;i++){
                        errors_text[i].style.display="none"
                    }

                    $.ajax({
                        url: './SendServiceEMail.php',
                        type: 'post',
                        data: {
                            service_id: "partners",
                            body: message,
                            subject: "Let's Talk Data",
                            body_type: 'text'
        },
        error:function(jqx,text,error)
        {
            let e;
                    if(jqx.responseJSON != undefined) e = jqx.responseJSON.error;
                    else e = error;
                            dialogWindow("Error in sending request: "+e, "error");
                            // alert("error in sending request")
                        },
                        success: function ( res )
                        {
                            dialogWindow('Thank you. The message has been sent.', "information");
                            // $('.form-control').val('');
                            // alert("Thank you for your message. We'll be in touch shortly.");
                            form.reset();
                        },
                        async: false
                    });


       
    }
    
})

