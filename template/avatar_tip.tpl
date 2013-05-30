<p>V2EX 第 ${id} 号会员</p>
<p>加入于 ${created|datetimeFormater}</p>
<p>用户名: ${username}</p>
{@if location && location != 'None'}
    <p>所在地: ${location}</p>
{@/if}
{@if tagline && tagline != 'None'}
    <p>签名: ${tagline}</p>
{@/if}
{@if website && website != 'None'}
    <p>个人网站: <a href="${website|urlChecker}">${website}</a></p>
{@/if}
