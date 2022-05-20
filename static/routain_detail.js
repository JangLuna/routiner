const baseUrl = 'http://localhost:3000';
let token = localStorage.getItem('HoopsToken');

if (token != undefined && token.length > 0) {
  // 토큰 검증
  axios
    .post(baseUrl + '/auth/verify_token', { token: token })
    .then((response) => {
      let tokenExpired = response.data.expired;
      let name =
        response.data.name != undefined ? response.data.name + " 's" : '';

      if (!tokenExpired) {
        // 토큰이 만료되지 않았을 떄( 로그인 상태 )
        $('#nav-button-box').hide();
        $('.hoops-title').text(`${name} 's Hoops`);
        mainInit();
      } else {
        // 만료되었을 때 (로그 아웃 상태 )
        localStorage.removeItem('HoopsToken');
        navBarInit();
      }
    });
} else {
  alert('로그인을 진행하여 주십시오.');
  location.href = '/';
}

function mainInit() {
  let routainId = Number(location.search.split('=')[1]);

  // $('.routain-modify-name').val(e.data.name);
  $('.routain-modify-save').attr('id', routainId);

  // atom list 불러오기
  axios({
    url: baseUrl + '/atom/get_atom_list',
    method: 'get',
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(async (res) => {
    if (res.data.code === 'SUCCESS') {
      let alreadyCheckedAtomIdList = undefined;

      // 이미 루틴에 속한 아톰에 체크
      await axios({
        url: baseUrl + '/routain/get_routain',
        method: 'post',
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          id: routainId
        }
      }).then((res) => {
        if (res.data.code === 'SUCCESS') {
          let routain = res.data.data.routain;

          $('#routain-modify-name').val(routain.name);

          let routainAtomIdList = routain.atomOrderString;

          if (routainAtomIdList != undefined) {
            routainAtomIdList.split(',').map(Number);
            alreadyCheckedAtomIdList = routainAtomIdList;
          }
        }
      });

      let atomList = res.data.data.totalAtomList;

      // atomlist 가 비어있으면
      if (atomList.length == 0) {
        $('.routain-modify-no-atoms').show();
      } else {
        // 아톰 리스트가 비어있지 않으면
        let jAtomList = $('.routain-modify-atom-list').empty();

        for (let i in atomList) {
          let atom = atomList[i];
          let type = atom.type;

          let jAtom = $(
            '<div class="form-check routain-modify-atom-list-item">' +
              `<input class="form-check-input routain-modify-atom-list-item-checkbox" name="routain-modify-atom-list-item-checkbox" type="checkbox" value=${atom.id} id="flexCheckDefault"/>` +
              `<label class="form-check-label" for="flexCheckDefault">${atom.text}</label>` +
              '</div>'
          );

          // 이미 루틴에 있는 아톰이라면 체크한
          if (alreadyCheckedAtomIdList.indexOf(atom.id) > -1) {
            jAtom.find('input').prop('checked', true);
          }

          if (type == 'MUST') {
            jAtom.find('label').css('color', '#d63384');
          } else {
            jAtom.find('label').css('color', '#198754');
          }

          jAtomList.append(jAtom);
        }
      }

      // 루틴 수정 팝업 save 버튼
      $('.routain-modify-save').on('click', function () {
        let routainId = Number($(this).attr('id'));

        let routainName = $('.routain-modify-name').val();

        if (routainName.trim().length == 0) {
          alert('루틴 이름을 입력하여 주십시오');
          return;
        }

        let jAtomCheckList = $(
          'input:checkbox[name="routain-modify-atom-list-item-checkbox"]'
        );
        let atomIdList = [];
        jAtomCheckList.each(function () {
          if (this.checked) {
            atomIdList.push(this.value);
          }
        });

        axios({
          url: baseUrl + '/routain/update_routain',
          method: 'patch',
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: {
            id: routainId,
            name: routainName,
            atomIdList: atomIdList.join(','),
            isUse: false
          }
        }).then((res) => {
          if (res.data.code === 'SUCCESS') {
            alert('루틴이 성공적으로 수정되었습니다.');
          } else {
            alert('오류가 발생했습니다.\n관리자에게 문의하세요');
          }
          location.reload();
        });
      });

      $('.routain-modify-cancel').on('click', function () {
        location.href = '/routain';
      });
    } else {
      alert('오류가 발생했습니다.\n관리자에게 문의하세요');
    }
  });
}

function navBarInit() {
  $('#nav-button-box').show();

  const signUpBtn = $('#signUpModal #btn-signup');
  const loginBtn = $('#loginModal #btn-login');

  // 로그인 팝업 에서 로그인 클릭 시
  loginBtn.on('click', function () {
    const userId = $('#login-user-id').val();
    const passcode = $('#login-user-passcode').val();

    axios
      .post(baseUrl + '/auth/signin', {
        id: userId,
        passcode: passcode
      })
      .then(function (response) {
        let data = response.data;

        localStorage.setItem('HoopsToken', data.data.token);

        alert('로그인에 성공했습니다!');
        $('#loginModal .btn-close').trigger('click');
        location.reload();
        return;
      })
      .catch(function (error) {
        alert('오류가 발생했습니다.');
        $('#loginModal .btn-close').trigger('click');
      });
  });

  // 회원가입 팝업에서 회원가입 클릭 시
  signUpBtn.on('click', function () {
    const userId = $('#signup-user-id').val();
    const userName = $('#signup-user-name').val();
    const passcode = $('#signup-user-passcode').val();
    const passcodeConfirm = $('#signup-user-passcode-confirm').val();

    if (userId.trim().length == 0) {
      alert('아이디를 확인하여 주십시오');
      return;
    }

    if (userName.trim().length == 0) {
      alert('이름을 확인하여 주십시오');
      return;
    }

    if (passcode.trim().length == 0) {
      alert('비밀번호를 확인하여 주십시오');
      return;
    }

    if (passcodeConfirm.trim().length == 0) {
      alert('비밀번호 확인란을 확인하여 주십시오');
      return;
    }

    if (passcode !== passcodeConfirm) {
      alert('비밀번호 확인과 비밀번호가 다릅니다.');
      return;
    }

    axios
      .post(baseUrl + '/auth/signup', {
        id: userId,
        passcode: passcode,
        name: userName
      })
      .then(function (response) {
        let data = response.data;
        let status = data.status;
        let code = data.code;

        if (code === 'SUCCESS') {
          alert('회원가입에 성공했습니다. 로그인 해 주세요.');
          $('#signUpModal .btn-close').trigger('click');
          return;
        }
      })
      .catch(function (error) {
        alert('오류가 발생했습니다.');
        $('#signUpModal .btn-close').trigger('click');
      });
  });
}
