using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MC.AspNetCore.Controllers.ViewModel.Kendo;
using MC.AspNetCore.Workflow.Model.Estado;
using MC.Interfaces.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using ProjetoPadrao.Extensions;
using ProjetoPadrao.ViewModel;

namespace ProjetoPadrao.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfigurarFluxoController(IUserContext userContext, IServiceProvider provider) : ControllerBase
    {


        [HttpGet("GetTree/{id}")]
        [ProducesResponseType(typeof(IEnumerable<TreeView>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Exception), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesDefaultResponseType]
        public async Task<IActionResult> GetTree([FromRoute] int id, CancellationToken ct)
        {
            try
            {
                var fluxo = await provider.GetRequiredRepository<Fluxo>().SingleAsync(ct, id);
                if (fluxo == null)
                {
                    return NotFound();
                }
                var result = await fluxo.ToTree(provider, userContext, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }
        }

        [HttpGet("GetFlowchart/{id}")]
        [ProducesResponseType(typeof(Flowchart), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Exception), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesDefaultResponseType]
        public async Task<IActionResult> GetFlowchart([FromRoute] int id, CancellationToken ct)
        {
            try
            {
                var fluxo = await provider.GetRequiredRepository<Fluxo>().SingleAsync(ct, id);
                if (fluxo == null)
                {
                    return NotFound();
                }
                var result = await fluxo.ToFlowchart(provider, userContext, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }
        }

    }
}
