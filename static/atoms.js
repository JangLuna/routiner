const baseUrl = 'http://localhost:3000';
let token = localStorage.getItem('HoopsToken');

if (token != undefined && token.length > 0) {
  // 토큰 검증
  axios
    .post(baseUrl + '/auth/verify_token', { token: token })
    .then((response) => {
      let tokenExpired = response.data.expired;

      if (!tokenExpired) {
        // 토큰이 만료되지 않았을 떄( 로그인 상태 )
        $('#nav-button-box').hide();
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
  // initialize atom list
  let jWantAtomList = $('.want-atom-list').empty();
  let jMustAtomList = $('.must-atom-list').empty();

  axios({
    url: baseUrl + '/atom/get_atom_list',
    method: 'get',
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then((res) => {
    // 데이터 객체로부터 가져오기
    let totalAtomList = res.data.data.totalAtomList;

    // 반복문
    for (let i in totalAtomList) {
      let atom = totalAtomList[i];

      let jAtom = $(
        '<li class="list-group-item">\n' +
          '<span>Item 1</span>\n' +
          '<i class="bi bi-trash" style="font-size: 16px; float: right"></i>\n' +
          '</li>'
      );

      // attribute mapping
      jAtom.attr('id', atom.id);
      jAtom.find('span').text(atom.text);

      // 삭제 버튼
      jAtom.find('i').on('click', function () {
        // 물어보기
        let result = confirm(
          '삭제할 시 복구할 수 없습니다.\n삭제하시겠습니까?'
        );

        if (result) {
          axios({
            url: baseUrl + '/atom/delete_atom',
            method: 'delete',
            headers: {
              Authorization: `Bearer ${token}`
            },
            data: {
              id: $(this).parent().attr('id')
            }
          })
            .then((res) => {
              if (res.data.code === 'SUCCESS') {
                alert('성공적으로 삭제되었습니다.');
              } else {
                alert('오류가 발생했습니다. 관리자에게 문의하여 주십시오');
              }
            })
            .catch((err) => {
              console.log(err);
              alert('오류가 발생했습니다. 관리자에게 문의하여 주십시오');
            });
        } else {
          return;
        }
      });

      // 리스트에 추가
      if (atom.type == 'MUST') {
        jMustAtomList.append(jAtom);
      } else {
        jWantAtomList.append(jAtom);
      }
    }
  });

  // add click event to atom input modal confirm button
  $('#must-atom-save').on('click', function () {
    let text = $('.must-atom-text').val();

    let axiosConfig = {
      url: baseUrl + '/atoms/create_atom',
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        text,
        type: 'MUST'
      }
    };

    axios(axiosConfig).then((res) => {
      let jMustAtomList = $('.must-atom-list');

      let atom = res.data.data;
      let atomText = atom.text;
      let atomId = atom.id;

      let jAtom = $(
        '<li class="list-group-item">\n' +
          '<span>Item 1</span>\n' +
          '<i class="bi bi-trash" style="font-size: 16px; float: right"></i>\n' +
          '</li>'
      );

      jAtom.attr('id', atomId);
      jAtom.find('span').text(atomText);

      jMustAtomList.append(jAtom);
      $('#mustAtomModal .btn-close').trigger('click');
    });
  });
  $('#want-atom-save').on('click', function () {
    let text = $('.want-atom-text').val();

    let axiosConfig = {
      url: baseUrl + '/atom/create_atom',
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        text,
        type: 'WANT'
      }
    };

    axios(axiosConfig).then((res) => {
      let jWantAtomList = $('.want-atom-list');

      let atom = res.data.data;
      let atomText = atom.text;
      let atomId = atom.id;

      let jAtom = $(
        '<li class="list-group-item">\n' +
          '<span>Item 1</span>\n' +
          '<i class="bi bi-trash" style="font-size: 16px; float: right"></i>\n' +
          '</li>'
      );

      jAtom.attr('id', atomId);
      jAtom.find('span').text(atomText);

      jWantAtomList.append(jAtom);

      $('#wantAtomModal .btn-close').trigger('click');
    });
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
